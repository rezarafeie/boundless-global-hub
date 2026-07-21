
-- Social CRM optimization: stop storing DMs/comments; fetch live from provider.
-- Drop the message and comment stores entirely (they will be fetched on demand).
DROP TABLE IF EXISTS public.social_messages CASCADE;
DROP TABLE IF EXISTS public.social_comments CASCADE;

-- Keep social_notifications for high-signal events only; purge historical noise.
DELETE FROM public.social_notifications
WHERE kind IN ('new_dm', 'comment');

-- Also drop the noisy AI log rows tied to auto-replies older than 14 days.
DELETE FROM public.social_ai_logs
WHERE created_at < now() - INTERVAL '14 days';

-- Add a cleanup helper that trims stale data. Called nightly.
CREATE OR REPLACE FUNCTION public.social_cleanup_stale_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Drop conversations not touched in 90 days (lightweight summary rows only).
  DELETE FROM public.social_conversations
  WHERE last_message_at < now() - INTERVAL '90 days';

  -- Drop notifications older than 30 days.
  DELETE FROM public.social_notifications
  WHERE created_at < now() - INTERVAL '30 days';

  -- Drop AI logs older than 30 days.
  DELETE FROM public.social_ai_logs
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;

-- Schedule the cleanup nightly at 03:00 UTC via pg_cron (idempotent).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('social-cleanup-stale-data')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'social-cleanup-stale-data');
    PERFORM cron.schedule('social-cleanup-stale-data', '0 3 * * *', $cron$SELECT public.social_cleanup_stale_data();$cron$);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron may not be enabled in this environment; ignore.
  NULL;
END $$;
