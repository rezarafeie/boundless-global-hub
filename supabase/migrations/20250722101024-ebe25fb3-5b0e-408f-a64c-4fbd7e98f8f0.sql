-- Add smart activation fields to courses table
ALTER TABLE public.courses 
ADD COLUMN smart_activation_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN smart_activation_telegram_link text;