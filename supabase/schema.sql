-- ============================================================
-- TODOonSTEROIDS — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. TABLES
-- ──────────────────────────────────────────────

-- profiles: one row per auth.users row
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text,
  email         text,
  avatar_url    text,
  current_plan_id uuid,           -- updated on plan switch; FK added below
  created_at    timestamptz DEFAULT now()
);

-- plans: max 2 per user (slot 1 or 2)
CREATE TABLE IF NOT EXISTS plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot        smallint NOT NULL CHECK (slot IN (1, 2)),
  name        text NOT NULL,
  exam_date   date NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, slot)
);

-- add FK from profiles.current_plan_id → plans.id
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_current_plan
  FOREIGN KEY (current_plan_id) REFERENCES plans(id) ON DELETE SET NULL;

-- subjects
CREATE TABLE IF NOT EXISTS subjects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- topics
CREATE TABLE IF NOT EXISTS topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  plan_id     uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at  timestamptz DEFAULT now()
);

-- tasks
CREATE TABLE IF NOT EXISTS tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id      uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id        uuid REFERENCES topics(id) ON DELETE SET NULL,
  title           text NOT NULL,
  scheduled_date  date NOT NULL,
  duration        integer NOT NULL DEFAULT 45,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'skipped')),
  time_slot       text,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- pomodoro_sessions
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id       uuid REFERENCES tasks(id) ON DELETE SET NULL,
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  duration      integer NOT NULL DEFAULT 25,
  type          text NOT NULL DEFAULT 'focus' CHECK (type IN ('focus', 'break')),
  status        text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'interrupted')),
  created_at    timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pomodoro_one_running_per_user
  ON pomodoro_sessions(user_id) WHERE status = 'running';

-- Session creation and completion use server time and verified ownership.
CREATE OR REPLACE FUNCTION public.start_pomodoro_session(
  p_plan_id uuid,
  p_task_id uuid,
  p_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_duration integer;
  v_active public.pomodoro_sessions%ROWTYPE;
  v_session_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF p_type IS NULL OR p_type NOT IN ('focus', 'break') THEN RAISE EXCEPTION 'invalid session type'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.plans p WHERE p.id = p_plan_id AND p.user_id = v_user_id
  ) THEN RAISE EXCEPTION 'plan not found'; END IF;
  IF p_task_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = p_task_id AND t.plan_id = p_plan_id AND t.user_id = v_user_id AND t.deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'task not found'; END IF;

  v_duration := CASE WHEN p_type = 'focus' THEN 25 ELSE 5 END;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text, 0));

  SELECT * INTO v_active
  FROM public.pomodoro_sessions ps
  WHERE ps.user_id = v_user_id AND ps.status = 'running'
  FOR UPDATE;

  IF FOUND THEN
    IF v_active.plan_id = p_plan_id
       AND v_active.task_id IS NOT DISTINCT FROM p_task_id
       AND v_active.type = p_type THEN
      RETURN v_active.id;
    END IF;
    IF v_active.started_at <= pg_catalog.clock_timestamp() - (v_active.duration * interval '1 minute') THEN
      UPDATE public.pomodoro_sessions ps
      SET status = 'completed', completed_at = pg_catalog.clock_timestamp()
      WHERE ps.id = v_active.id AND ps.user_id = v_user_id AND ps.status = 'running';
    ELSE
      UPDATE public.pomodoro_sessions ps
      SET status = 'interrupted'
      WHERE ps.id = v_active.id AND ps.user_id = v_user_id AND ps.status = 'running';
    END IF;
  END IF;

  INSERT INTO public.pomodoro_sessions (
    plan_id, user_id, task_id, started_at, duration, type, status
  ) VALUES (
    p_plan_id, v_user_id, p_task_id, pg_catalog.clock_timestamp(), v_duration, p_type, 'running'
  ) RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

DROP FUNCTION IF EXISTS public.complete_pomodoro_session(uuid);
CREATE FUNCTION public.complete_pomodoro_session(p_session_id uuid)
RETURNS TABLE (
  session_id uuid,
  session_plan_id uuid,
  session_type text,
  session_duration integer,
  completed_now boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session public.pomodoro_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;

  SELECT * INTO v_session
  FROM public.pomodoro_sessions ps
  WHERE ps.id = p_session_id AND ps.user_id = v_user_id
  FOR UPDATE;

  IF FOUND AND v_session.status = 'completed' THEN
    RETURN QUERY SELECT v_session.id, v_session.plan_id, v_session.type, v_session.duration, false;
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.pomodoro_sessions AS ps
  SET status = 'completed', completed_at = pg_catalog.clock_timestamp()
  WHERE ps.id = p_session_id
    AND ps.user_id = v_user_id
    AND ps.status = 'running'
    AND ps.started_at <= pg_catalog.clock_timestamp() - (ps.duration * interval '1 minute')
  RETURNING ps.id, ps.plan_id, ps.type, ps.duration, true;

  IF NOT FOUND THEN RAISE EXCEPTION 'session is not eligible for completion'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_pomodoro_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  UPDATE public.pomodoro_sessions AS ps
  SET status = 'interrupted'
  WHERE ps.id = p_session_id AND ps.user_id = v_user_id AND ps.status = 'running';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.start_pomodoro_session(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_pomodoro_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_pomodoro_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_pomodoro_session(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pomodoro_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_pomodoro_session(uuid) TO authenticated;

-- activity_events (audit log)
CREATE TABLE IF NOT EXISTS activity_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id       uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  event_type    text NOT NULL,
  metadata      jsonb,
  created_at    timestamptz DEFAULT now()
);

-- plan_imports (idempotency key tracking)
CREATE TABLE IF NOT EXISTS plan_imports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id          uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  idempotency_key  text NOT NULL,
  version          text DEFAULT '1.0',
  created_at       timestamptz DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

-- ──────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_imports      ENABLE ROW LEVEL SECURITY;

-- Remove permissive policies so the row ownership checks below cannot be bypassed.
DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'plans', 'subjects', 'topics', 'tasks', 'pomodoro_sessions', 'activity_events', 'plan_imports')
  LOOP
    EXECUTE pg_catalog.format('DROP POLICY %I ON %I.%I', v_policy.policyname, v_policy.schemaname, v_policy.tablename);
  END LOOP;
END;
$$;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id
  AND (current_plan_id IS NULL OR EXISTS (
    SELECT 1 FROM public.plans p WHERE p.id = current_plan_id AND p.user_id = auth.uid()
  ))
);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (
  auth.uid() = id
  AND (current_plan_id IS NULL OR EXISTS (
    SELECT 1 FROM public.plans p WHERE p.id = current_plan_id AND p.user_id = auth.uid()
  ))
);

CREATE POLICY "plans_all" ON plans
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subjects_all" ON subjects
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  );

CREATE POLICY "topics_all" ON topics
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = subject_id AND s.plan_id = plan_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = subject_id AND s.plan_id = plan_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_all" ON tasks
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = subject_id AND s.plan_id = plan_id AND s.user_id = auth.uid()
    )
    AND (
      topic_id IS NULL OR EXISTS (
        SELECT 1 FROM public.topics tp
        WHERE tp.id = topic_id AND tp.plan_id = plan_id
          AND tp.subject_id = subject_id AND tp.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = subject_id AND s.plan_id = plan_id AND s.user_id = auth.uid()
    )
    AND (
      topic_id IS NULL OR EXISTS (
        SELECT 1 FROM public.topics tp
        WHERE tp.id = topic_id AND tp.plan_id = plan_id
          AND tp.subject_id = subject_id AND tp.user_id = auth.uid()
      )
    )
  );

-- Users may read only their own internally consistent sessions. All writes go through
-- the authenticated, server-timed RPC functions above.
CREATE POLICY "pomodoro_select_own" ON pomodoro_sessions FOR SELECT USING (
  auth.uid() = pomodoro_sessions.user_id
  AND EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = pomodoro_sessions.plan_id AND p.user_id = auth.uid()
  )
  AND (
    pomodoro_sessions.task_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = pomodoro_sessions.task_id
        AND t.plan_id = pomodoro_sessions.plan_id
        AND t.user_id = auth.uid()
    )
  )
);
REVOKE INSERT, UPDATE, DELETE ON TABLE pomodoro_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE pomodoro_sessions TO authenticated;

CREATE POLICY "activity_all" ON activity_events
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
    AND CASE entity_type
      WHEN 'plan' THEN EXISTS (
        SELECT 1 FROM public.plans p WHERE p.id::text = entity_id AND p.id = plan_id AND p.user_id = auth.uid()
      )
      WHEN 'subject' THEN EXISTS (
        SELECT 1 FROM public.subjects s WHERE s.id::text = entity_id AND s.plan_id = plan_id AND s.user_id = auth.uid()
      )
      WHEN 'task' THEN EXISTS (
        SELECT 1 FROM public.tasks t WHERE t.id::text = entity_id AND t.plan_id = plan_id AND t.user_id = auth.uid()
      )
      WHEN 'pomodoro' THEN EXISTS (
        SELECT 1 FROM public.pomodoro_sessions ps WHERE ps.id::text = entity_id AND ps.plan_id = plan_id AND ps.user_id = auth.uid()
      )
      ELSE true
    END
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
    AND CASE entity_type
      WHEN 'plan' THEN EXISTS (
        SELECT 1 FROM public.plans p WHERE p.id::text = entity_id AND p.id = plan_id AND p.user_id = auth.uid()
      )
      WHEN 'subject' THEN EXISTS (
        SELECT 1 FROM public.subjects s WHERE s.id::text = entity_id AND s.plan_id = plan_id AND s.user_id = auth.uid()
      )
      WHEN 'task' THEN EXISTS (
        SELECT 1 FROM public.tasks t WHERE t.id::text = entity_id AND t.plan_id = plan_id AND t.user_id = auth.uid()
      )
      WHEN 'pomodoro' THEN EXISTS (
        SELECT 1 FROM public.pomodoro_sessions ps WHERE ps.id::text = entity_id AND ps.plan_id = plan_id AND ps.user_id = auth.uid()
      )
      ELSE true
    END
  );

CREATE POLICY "imports_all" ON plan_imports
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  );

-- ──────────────────────────────────────────────
-- 3. AUTO-CREATE PROFILE ON SIGN-UP
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ──────────────────────────────────────────────
-- 4. INDEXES (performance)
-- ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_plans_user_id      ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_plan_id   ON subjects(plan_id);
CREATE INDEX IF NOT EXISTS idx_topics_plan_id     ON topics(plan_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id  ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_plan_id      ON tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled    ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_pomodoro_plan_id   ON pomodoro_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_started   ON pomodoro_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_activity_user_id   ON activity_events(user_id);
