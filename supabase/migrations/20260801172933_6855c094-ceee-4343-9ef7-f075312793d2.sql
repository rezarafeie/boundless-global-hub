ALTER TABLE public.support_activation_custom_followups
ADD COLUMN IF NOT EXISTS only_if_activated boolean NOT NULL DEFAULT false;