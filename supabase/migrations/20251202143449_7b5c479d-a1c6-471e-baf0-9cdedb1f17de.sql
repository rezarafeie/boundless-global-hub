-- Create daily_reports table
CREATE TABLE public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('sales', 'support')),
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_date)
);

-- Create report_ai_analysis table
CREATE TABLE public.report_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer REFERENCES public.chat_users(id) ON DELETE CASCADE,
  analysis_date date NOT NULL,
  accuracy_score numeric,
  highlights text[],
  anomalies text[],
  suggestions text[],
  motivation text,
  raw_analysis text,
  platform_metrics jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_ai_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_reports
CREATE POLICY "Users can view their own reports"
ON public.daily_reports FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own reports"
ON public.daily_reports FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own reports"
ON public.daily_reports FOR UPDATE
USING (true);

-- RLS policies for report_ai_analysis
CREATE POLICY "Anyone can view AI analysis"
ON public.report_ai_analysis FOR SELECT
USING (true);

CREATE POLICY "System can insert AI analysis"
ON public.report_ai_analysis FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_daily_reports_user_date ON public.daily_reports(user_id, report_date);
CREATE INDEX idx_daily_reports_date ON public.daily_reports(report_date);
CREATE INDEX idx_report_ai_analysis_date ON public.report_ai_analysis(analysis_date);

-- Trigger for updated_at
CREATE TRIGGER update_daily_reports_updated_at
BEFORE UPDATE ON public.daily_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();