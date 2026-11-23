ALTER TABLE public.chat_users ADD COLUMN IF NOT EXISTS messenger_telegram_sync boolean NOT NULL DEFAULT true;

CREATE TABLE public.messenger_telegram_links (
  id bigserial PRIMARY KEY,
  kind text NOT NULL,
  conversation_id bigint NOT NULL,
  message_id bigint NOT NULL,
  chat_user_id integer NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  telegram_chat_id bigint NOT NULL,
  telegram_message_id bigint,
  direction text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX messenger_tg_out_once ON public.messenger_telegram_links(kind, message_id, chat_user_id) WHERE direction = 'out';
CREATE UNIQUE INDEX messenger_tg_by_tg ON public.messenger_telegram_links(telegram_chat_id, telegram_message_id) WHERE telegram_message_id IS NOT NULL;
GRANT ALL ON public.messenger_telegram_links TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.messenger_telegram_links_id_seq TO service_role;
ALTER TABLE public.messenger_telegram_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to telegram links" ON public.messenger_telegram_links FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER messenger_telegram_relay_private AFTER INSERT ON public.private_messages
  FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/messenger-telegram-relay', 'POST', '{"Content-type":"application/json"}', '{}', '5000');
CREATE TRIGGER messenger_telegram_relay_messenger AFTER INSERT ON public.messenger_messages
  FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/messenger-telegram-relay', 'POST', '{"Content-type":"application/json"}', '{}', '5000');