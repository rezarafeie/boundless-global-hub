
-- Scheduled posts / content planner
CREATE TABLE public.social_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'post',
  caption TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  provider_post_id TEXT,
  publish_attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_social_sched_status_time ON public.social_scheduled_posts(status, scheduled_at);
CREATE INDEX idx_social_sched_account ON public.social_scheduled_posts(account_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_scheduled_posts TO authenticated;
GRANT ALL ON public.social_scheduled_posts TO service_role;
ALTER TABLE public.social_scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage scheduled posts"
  ON public.social_scheduled_posts FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Knowledge base for AI
CREATE TABLE public.social_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'faq',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_social_kb_active ON public.social_knowledge_base(is_active, priority DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_knowledge_base TO authenticated;
GRANT ALL ON public.social_knowledge_base TO service_role;
ALTER TABLE public.social_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage kb"
  ON public.social_knowledge_base FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Daily analytics rollup
CREATE TABLE public.social_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  dm_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  ai_reply_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  lead_count INT NOT NULL DEFAULT 0,
  posts_published INT NOT NULL DEFAULT 0,
  avg_response_seconds NUMERIC,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, day)
);
CREATE INDEX idx_social_analytics_day ON public.social_analytics_daily(day DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_analytics_daily TO authenticated;
GRANT ALL ON public.social_analytics_daily TO service_role;
ALTER TABLE public.social_analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read analytics"
  ON public.social_analytics_daily FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service manages analytics"
  ON public.social_analytics_daily FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Notifications feed
CREATE TABLE public.social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_social_notif_read ON public.social_notifications(is_read, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_notifications TO authenticated;
GRANT ALL ON public.social_notifications TO service_role;
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read/update notifications"
  ON public.social_notifications FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.social_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_social_sched_updated BEFORE UPDATE ON public.social_scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.social_touch_updated_at();
CREATE TRIGGER trg_social_kb_updated BEFORE UPDATE ON public.social_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.social_touch_updated_at();
CREATE TRIGGER trg_social_analytics_updated BEFORE UPDATE ON public.social_analytics_daily
  FOR EACH ROW EXECUTE FUNCTION public.social_touch_updated_at();

-- Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_notifications;
