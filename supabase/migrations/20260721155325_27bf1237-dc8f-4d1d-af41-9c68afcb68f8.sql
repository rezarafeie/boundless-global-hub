
-- Social CRM Phase 1 schema

-- 1) social_accounts: connected IG/other accounts via NovinHub
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'instagram',
  novinhub_account_id TEXT NOT NULL,
  novinhub_identifier TEXT,
  username TEXT NOT NULL,
  profile_pic_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  can_send_direct BOOLEAN NOT NULL DEFAULT true,
  can_send_comment BOOLEAN NOT NULL DEFAULT true,
  can_send_post BOOLEAN NOT NULL DEFAULT true,
  login_required BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, novinhub_account_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
GRANT SELECT ON public.social_accounts TO anon;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_accounts admin all" ON public.social_accounts
  FOR ALL USING (true) WITH CHECK (true);

-- 2) social_conversations
CREATE TABLE public.social_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  provider_thread_id TEXT NOT NULL,
  participant_username TEXT,
  participant_name TEXT,
  participant_pic_url TEXT,
  participant_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_direction TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- open, assigned, archived, closed
  assigned_to INTEGER,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  labels TEXT[] NOT NULL DEFAULT '{}',
  lead_score INTEGER NOT NULL DEFAULT 0,
  customer_status TEXT,
  last_responder TEXT, -- ai, human, user
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, provider_thread_id)
);

CREATE INDEX idx_social_conv_account_last ON public.social_conversations(account_id, last_message_at DESC);
CREATE INDEX idx_social_conv_status ON public.social_conversations(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_conversations TO authenticated;
GRANT ALL ON public.social_conversations TO service_role;
GRANT SELECT ON public.social_conversations TO anon;
ALTER TABLE public.social_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_conversations admin all" ON public.social_conversations
  FOR ALL USING (true) WITH CHECK (true);

-- 3) social_messages
CREATE TABLE public.social_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.social_conversations(id) ON DELETE CASCADE,
  provider_message_id TEXT,
  direction TEXT NOT NULL, -- in, out
  sender_type TEXT NOT NULL DEFAULT 'user', -- user, ai, human
  sender_user_id INTEGER,
  text TEXT,
  media_url TEXT,
  media_type TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, provider_message_id)
);

CREATE INDEX idx_social_msg_conv_sent ON public.social_messages(conversation_id, sent_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_messages TO authenticated;
GRANT ALL ON public.social_messages TO service_role;
GRANT SELECT ON public.social_messages TO anon;
ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_messages admin all" ON public.social_messages
  FOR ALL USING (true) WITH CHECK (true);

-- 4) social_conversation_notes
CREATE TABLE public.social_conversation_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.social_conversations(id) ON DELETE CASCADE,
  author_user_id INTEGER,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_conversation_notes TO authenticated;
GRANT ALL ON public.social_conversation_notes TO service_role;
ALTER TABLE public.social_conversation_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_notes admin all" ON public.social_conversation_notes
  FOR ALL USING (true) WITH CHECK (true);

-- 5) social_ai_logs
CREATE TABLE public.social_ai_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.social_conversations(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- suggest, translate, summarize, followup, auto_reply
  input JSONB,
  output JSONB,
  model TEXT,
  latency_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.social_ai_logs TO authenticated;
GRANT ALL ON public.social_ai_logs TO service_role;
ALTER TABLE public.social_ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_ai_logs admin all" ON public.social_ai_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 6) social_settings singleton
CREATE TABLE public.social_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  ai_tone TEXT NOT NULL DEFAULT 'friendly',
  ai_language TEXT NOT NULL DEFAULT 'fa',
  ai_auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_confidence_threshold NUMERIC NOT NULL DEFAULT 0.75,
  business_hours JSONB NOT NULL DEFAULT '{"enabled":false,"start":"09:00","end":"21:00"}'::jsonb,
  escalation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  novinhub_default_account_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT social_settings_singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE ON public.social_settings TO authenticated;
GRANT ALL ON public.social_settings TO service_role;
GRANT SELECT ON public.social_settings TO anon;
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_settings admin all" ON public.social_settings
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.social_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 7) trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_social_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_social_accounts_updated BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_social_updated_at();
CREATE TRIGGER trg_social_conversations_updated BEFORE UPDATE ON public.social_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_social_updated_at();

-- 8) enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_messages;
