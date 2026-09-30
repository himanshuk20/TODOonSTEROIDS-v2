-- Move Pomodoro writes behind server-timed, owner-checked RPC functions.
ALTER TABLE public.pomodoro_sessions
  ALTER COLUMN status SET DEFAULT 'running';

ALTER TABLE public.pomodoro_sessions
  DROP CONSTRAINT IF EXISTS pomodoro_sessions_status_check;

ALTER TABLE public.pomodoro_sessions
  ADD CONSTRAINT pomodoro_sessions_status_check
  CHECK (status IN ('running', 'completed', 'interrupted'));

CREATE UNIQUE INDEX IF NOT EXISTS pomodoro_one_running_per_user
  ON public.pomodoro_sessions(user_id) WHERE status = 'running';

DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'pomodoro_sessions'
  LOOP
    EXECUTE pg_catalog.format('DROP POLICY %I ON public.pomodoro_sessions', v_policy.policyname);
  END LOOP;
END;
$$;

CREATE POLICY "pomodoro_select_own" ON public.pomodoro_sessions FOR SELECT USING (
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

REVOKE INSERT, UPDATE, DELETE ON TABLE public.pomodoro_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.pomodoro_sessions TO authenticated;

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
