-- Built-in analytics tables and policies (idempotent)
-- 1) Create analytics_sessions
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  session_id TEXT PRIMARY KEY,
  ip_hash TEXT,
  country TEXT,
  device TEXT,
  user_agent TEXT,
  source TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  pageviews INTEGER NOT NULL DEFAULT 0
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_last_seen ON public.analytics_sessions (last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_source ON public.analytics_sessions (source);

-- 2) Create analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.analytics_sessions(session_id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  referrer TEXT,
  browser TEXT,
  device TEXT,
  country TEXT,
  screen_w INTEGER,
  screen_h INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL DEFAULT 'pageview',
  source TEXT
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON public.analytics_events (path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_source ON public.analytics_events (source);

-- Enable RLS
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analytics_sessions' AND policyname = 'Public can insert sessions'
  ) THEN
    CREATE POLICY "Public can insert sessions"
    ON public.analytics_sessions
    FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analytics_sessions' AND policyname = 'Public can select sessions'
  ) THEN
    CREATE POLICY "Public can select sessions"
    ON public.analytics_sessions
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analytics_sessions' AND policyname = 'Public can update sessions'
  ) THEN
    CREATE POLICY "Public can update sessions"
    ON public.analytics_sessions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;
END$$;

-- Policies for analytics_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analytics_events' AND policyname = 'Public can insert events'
  ) THEN
    CREATE POLICY "Public can insert events"
    ON public.analytics_events
    FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analytics_events' AND policyname = 'Public can select events'
  ) THEN
    CREATE POLICY "Public can select events"
    ON public.analytics_events
    FOR SELECT
    USING (true);
  END IF;
END$$;

-- Optional: trigger to keep last_seen/pageviews in sync when a pageview event is inserted
-- Create function
CREATE OR REPLACE FUNCTION public.update_session_on_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment pageviews for pageview events
  IF NEW.event_type = 'pageview' THEN
    UPDATE public.analytics_sessions
    SET last_seen = COALESCE(NEW.created_at, now()),
        pageviews = pageviews + 1
    WHERE session_id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgrelid = 'public.analytics_events'::regclass 
      AND tgname = 'trg_update_session_on_event'
  ) THEN
    CREATE TRIGGER trg_update_session_on_event
    AFTER INSERT ON public.analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_on_event();
  END IF;
END$$;