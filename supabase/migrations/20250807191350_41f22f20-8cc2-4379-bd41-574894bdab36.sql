-- Create daily analytics reports table
CREATE TABLE IF NOT EXISTS public.analytics_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE UNIQUE NOT NULL,
  visitors INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  views_per_visit NUMERIC(10,2) NOT NULL DEFAULT 0,
  avg_session_duration INTEGER NOT NULL DEFAULT 0, -- seconds
  bounce_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  pages JSONB NULL,
  sources JSONB NULL,
  devices JSONB NULL,
  countries JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_daily_reports ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analytics_daily_reports' AND policyname = 'Anyone can view analytics daily reports'
  ) THEN
    CREATE POLICY "Anyone can view analytics daily reports"
    ON public.analytics_daily_reports
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analytics_daily_reports' AND policyname = 'Admins can manage analytics daily reports'
  ) THEN
    CREATE POLICY "Admins can manage analytics daily reports"
    ON public.analytics_daily_reports
    FOR ALL
    USING (is_academy_admin_safe(auth.uid()))
    WITH CHECK (is_academy_admin_safe(auth.uid()));
  END IF;
END $$;

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_analytics_daily_reports_updated_at ON public.analytics_daily_reports;
CREATE TRIGGER update_analytics_daily_reports_updated_at
BEFORE UPDATE ON public.analytics_daily_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index on report_date (already unique)
CREATE INDEX IF NOT EXISTS idx_analytics_daily_reports_date ON public.analytics_daily_reports (report_date);
