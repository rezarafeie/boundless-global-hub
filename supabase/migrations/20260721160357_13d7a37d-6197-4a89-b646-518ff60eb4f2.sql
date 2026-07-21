-- Extend social_accounts with auto-reply settings
ALTER TABLE public.social_accounts
  ADD COLUMN IF NOT EXISTS auto_reply_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_system_prompt text,
  ADD COLUMN IF NOT EXISTS ai_min_confidence numeric NOT NULL DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS auto_reply_comment_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.social_conversations
  ADD COLUMN IF NOT EXISTS needs_reply boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_auto_reply_at timestamptz;

CREATE TABLE IF NOT EXISTS public.social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  provider_comment_id text NOT NULL,
  provider_post_id text,
  parent_comment_id text,
  author_username text,
  author_name text,
  author_pic_url text,
  text text,
  status text NOT NULL DEFAULT 'new',
  is_reply boolean NOT NULL DEFAULT false,
  replied_at timestamptz,
  reply_text text,
  sent_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, provider_comment_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_comments TO authenticated;
GRANT ALL ON public.social_comments TO service_role;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_comments admin all" ON public.social_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  provider_post_id text NOT NULL,
  post_type text,
  caption text,
  media_url text,
  thumbnail_url text,
  permalink text,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'unknown',
  comments_count integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, provider_post_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_posts admin all" ON public.social_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.social_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.social_conversations(id) ON DELETE SET NULL,
  comment_id uuid REFERENCES public.social_comments(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'dm',
  username text,
  name text,
  phone text,
  email text,
  score integer NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'new',
  assigned_to uuid,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  ai_summary text,
  crm_note_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_leads_account_idx ON public.social_leads(account_id);
CREATE INDEX IF NOT EXISTS social_leads_stage_idx ON public.social_leads(stage);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_leads TO authenticated;
GRANT ALL ON public.social_leads TO service_role;
ALTER TABLE public.social_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_leads admin all" ON public.social_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER social_comments_updated_at BEFORE UPDATE ON public.social_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER social_posts_updated_at BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER social_leads_updated_at BEFORE UPDATE ON public.social_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.social_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_leads;