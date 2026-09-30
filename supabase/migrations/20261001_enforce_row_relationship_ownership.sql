-- Keep every user-owned row linked only to parent rows owned by the same user.
-- Reset policies on these tables so no older permissive policy can override the checks.
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

-- Profiles may select and update their own active plan only when it is theirs.
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
    AND (current_plan_id IS NULL OR EXISTS (
      SELECT 1 FROM public.plans p WHERE p.id = current_plan_id AND p.user_id = auth.uid()
    ))
  );
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (current_plan_id IS NULL OR EXISTS (
      SELECT 1 FROM public.plans p WHERE p.id = current_plan_id AND p.user_id = auth.uid()
    ))
  );

CREATE POLICY "plans_all" ON public.plans
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subjects_all" ON public.subjects
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  );

CREATE POLICY "topics_all" ON public.topics
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

CREATE POLICY "tasks_all" ON public.tasks
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
        WHERE tp.id = topic_id
          AND tp.plan_id = plan_id
          AND tp.subject_id = subject_id
          AND tp.user_id = auth.uid()
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
        WHERE tp.id = topic_id
          AND tp.plan_id = plan_id
          AND tp.subject_id = subject_id
          AND tp.user_id = auth.uid()
      )
    )
  );

-- Preserve the existing read-only Pomodoro table boundary.
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

CREATE POLICY "activity_all" ON public.activity_events
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
    AND CASE entity_type
      WHEN 'plan' THEN EXISTS (
        SELECT 1 FROM public.plans p
        WHERE p.id::text = entity_id AND p.id = plan_id AND p.user_id = auth.uid()
      )
      WHEN 'subject' THEN EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id::text = entity_id AND s.plan_id = plan_id AND s.user_id = auth.uid()
      )
      WHEN 'task' THEN EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id::text = entity_id AND t.plan_id = plan_id AND t.user_id = auth.uid()
      )
      WHEN 'pomodoro' THEN EXISTS (
        SELECT 1 FROM public.pomodoro_sessions ps
        WHERE ps.id::text = entity_id AND ps.plan_id = plan_id AND ps.user_id = auth.uid()
      )
      ELSE true
    END
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
    AND CASE entity_type
      WHEN 'plan' THEN EXISTS (
        SELECT 1 FROM public.plans p
        WHERE p.id::text = entity_id AND p.id = plan_id AND p.user_id = auth.uid()
      )
      WHEN 'subject' THEN EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id::text = entity_id AND s.plan_id = plan_id AND s.user_id = auth.uid()
      )
      WHEN 'task' THEN EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id::text = entity_id AND t.plan_id = plan_id AND t.user_id = auth.uid()
      )
      WHEN 'pomodoro' THEN EXISTS (
        SELECT 1 FROM public.pomodoro_sessions ps
        WHERE ps.id::text = entity_id AND ps.plan_id = plan_id AND ps.user_id = auth.uid()
      )
      ELSE true
    END
  );

CREATE POLICY "imports_all" ON public.plan_imports
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  );
