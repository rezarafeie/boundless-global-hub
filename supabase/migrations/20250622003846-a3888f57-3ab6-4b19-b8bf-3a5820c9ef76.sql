
-- Add messenger_admin role to chat_users table and support agent assignments
ALTER TABLE public.chat_users ADD COLUMN IF NOT EXISTS is_messenger_admin boolean DEFAULT false;

-- Create support agent assignments table to link agents to specific thread types
CREATE TABLE IF NOT EXISTS public.support_agent_assignments (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  thread_type_id INTEGER REFERENCES public.support_thread_types(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(agent_id, thread_type_id)
);

-- Insert default support thread types if they don't exist
INSERT INTO public.support_thread_types (id, name, display_name, description, is_boundless_only) 
VALUES 
  (1, 'academy_support', 'پشتیبانی آکادمی رفیعی', 'پشتیبانی عمومی آکادمی رفیعی', false),
  (2, 'boundless_support', 'پشتیبانی بدون مرز', 'پشتیبانی ویژه اعضای بدون مرز', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_boundless_only = EXCLUDED.is_boundless_only;
