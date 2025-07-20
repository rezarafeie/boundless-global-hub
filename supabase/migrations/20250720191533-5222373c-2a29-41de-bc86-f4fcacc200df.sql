
-- Add chat_user_id field to enrollments table to link with messenger auth system
ALTER TABLE public.enrollments 
ADD COLUMN chat_user_id integer REFERENCES public.chat_users(id);

-- Create index for better performance on lookups
CREATE INDEX idx_enrollments_chat_user_id ON public.enrollments(chat_user_id);

-- Update existing enrollments to link them with chat_users based on phone/email matching
-- This will help maintain existing enrollments when switching to unified auth
UPDATE public.enrollments 
SET chat_user_id = (
  SELECT cu.id 
  FROM public.chat_users cu 
  WHERE cu.phone = enrollments.phone 
     OR cu.email = enrollments.email
  LIMIT 1
)
WHERE chat_user_id IS NULL;
