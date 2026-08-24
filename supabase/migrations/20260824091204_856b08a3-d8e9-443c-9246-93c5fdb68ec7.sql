CREATE INDEX IF NOT EXISTS idx_webinar_messages_webinar_created
  ON public.webinar_messages (webinar_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_webinar_chat_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_ts timestamptz;
BEGIN
  IF NEW.participant_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT max(created_at) INTO last_ts
  FROM public.webinar_messages
  WHERE webinar_id = NEW.webinar_id
    AND participant_id = NEW.participant_id;

  IF last_ts IS NOT NULL AND now() - last_ts < interval '2 seconds' THEN
    RAISE EXCEPTION 'chat rate limit: please wait before sending another message';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_webinar_chat_rate_limit ON public.webinar_messages;
CREATE TRIGGER trg_webinar_chat_rate_limit
  BEFORE INSERT ON public.webinar_messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_webinar_chat_rate_limit();