CREATE TABLE public.challenge_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id integer NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  telegram_chat_id bigint,
  telegram_id bigint,
  opened_bot_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);
GRANT ALL ON public.challenge_activations TO service_role;
ALTER TABLE public.challenge_activations ENABLE ROW LEVEL SECURITY;