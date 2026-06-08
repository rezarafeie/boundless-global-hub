
-- 1. enrollment_followup_events
CREATE TABLE IF NOT EXISTS public.enrollment_followup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  message_text text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  user_replied_at timestamptz,
  reply_text text
);
GRANT SELECT ON public.enrollment_followup_events TO authenticated;
GRANT ALL ON public.enrollment_followup_events TO service_role;
ALTER TABLE public.enrollment_followup_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read followup events" ON public.enrollment_followup_events;
CREATE POLICY "admins read followup events" ON public.enrollment_followup_events
  FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_efe_enrollment ON public.enrollment_followup_events(enrollment_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_efe_event_type ON public.enrollment_followup_events(event_type, sent_at DESC);

-- 2. enrollments new columns
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS last_lesson_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS coaching_lessons_since_checkin integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inactivity_stage smallint NOT NULL DEFAULT 0;

-- 3. courses followup config
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS rafiei_bot_followup_config jsonb NOT NULL DEFAULT
    '{"lesson_complete":true,"course_complete":true,"inactivity":true,"coaching":true}'::jsonb;

-- 4. trigger on user_lesson_progress to bump counters & enqueue
CREATE OR REPLACE FUNCTION public.fn_enrollment_on_lesson_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone text;
  v_enr record;
  v_lesson_title text;
  v_total int;
  v_done int;
  v_course_done boolean := false;
BEGIN
  IF NEW.is_completed IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_completed IS TRUE THEN RETURN NEW; END IF;

  SELECT phone INTO v_phone FROM public.chat_users WHERE id = NEW.user_id;
  IF v_phone IS NULL THEN RETURN NEW; END IF;

  SELECT e.*, c.rafiei_bot_followup_enabled, c.rafiei_bot_followup_config, c.title AS course_title
    INTO v_enr
    FROM public.enrollments e
    JOIN public.courses c ON c.id = e.course_id
    WHERE e.phone = v_phone AND e.course_id = NEW.course_id
    ORDER BY e.created_at DESC LIMIT 1;
  IF v_enr.id IS NULL THEN RETURN NEW; END IF;

  SELECT title INTO v_lesson_title FROM public.course_lessons WHERE id = NEW.lesson_id;
  SELECT COUNT(*) INTO v_total FROM public.course_lessons WHERE course_id = NEW.course_id;
  SELECT COUNT(*) INTO v_done FROM public.user_lesson_progress
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id AND is_completed = true;
  IF v_total > 0 AND v_done >= v_total THEN v_course_done := true; END IF;

  UPDATE public.enrollments SET
    last_lesson_completed_at = now(),
    last_activity_at = now(),
    coaching_lessons_since_checkin = coaching_lessons_since_checkin + 1,
    inactivity_stage = 0
  WHERE id = v_enr.id;

  IF v_enr.telegram_chat_id IS NOT NULL AND v_enr.rafiei_bot_followup_enabled THEN
    IF v_course_done AND COALESCE((v_enr.rafiei_bot_followup_config->>'course_complete')::boolean, true) THEN
      INSERT INTO public.telegram_notification_queue
        (chat_id, notification_type, status, payload)
      VALUES
        (v_enr.telegram_chat_id, 'enrollment_course_complete', 'pending',
         jsonb_build_object('enrollment_id', v_enr.id, 'course_id', NEW.course_id,
                            'lesson_id', NEW.lesson_id, 'lesson_title', v_lesson_title,
                            'total', v_total, 'done', v_done));
    ELSIF COALESCE((v_enr.rafiei_bot_followup_config->>'lesson_complete')::boolean, true) THEN
      INSERT INTO public.telegram_notification_queue
        (chat_id, notification_type, status, payload)
      VALUES
        (v_enr.telegram_chat_id, 'enrollment_lesson_complete', 'pending',
         jsonb_build_object('enrollment_id', v_enr.id, 'course_id', NEW.course_id,
                            'lesson_id', NEW.lesson_id, 'lesson_title', v_lesson_title,
                            'total', v_total, 'done', v_done));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_on_lesson_complete ON public.user_lesson_progress;
CREATE TRIGGER trg_enrollment_on_lesson_complete
AFTER INSERT OR UPDATE OF is_completed ON public.user_lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.fn_enrollment_on_lesson_complete();
