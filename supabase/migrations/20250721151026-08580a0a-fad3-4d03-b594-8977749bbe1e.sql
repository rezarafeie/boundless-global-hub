-- Add required activation fields to courses table
ALTER TABLE public.courses 
ADD COLUMN support_activation_required BOOLEAN DEFAULT FALSE,
ADD COLUMN telegram_activation_required BOOLEAN DEFAULT FALSE;