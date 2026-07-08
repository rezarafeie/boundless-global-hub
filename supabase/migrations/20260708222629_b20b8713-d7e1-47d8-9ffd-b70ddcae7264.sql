ALTER TABLE public.support_activation_custom_followups
DROP CONSTRAINT IF EXISTS support_activation_custom_followups_channel_check;

ALTER TABLE public.support_activation_custom_followups
ADD CONSTRAINT support_activation_custom_followups_channel_check
CHECK (channel = ANY (ARRAY['bot'::text, 'email'::text, 'sms'::text, 'business'::text]));