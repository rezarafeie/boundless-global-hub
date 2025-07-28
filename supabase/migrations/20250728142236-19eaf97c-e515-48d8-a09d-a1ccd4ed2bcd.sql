-- Fix the foreign key constraint on lead_distribution_logs
-- First drop the incorrect foreign key constraint
ALTER TABLE public.lead_distribution_logs 
DROP CONSTRAINT IF EXISTS fk_sales_agent_id;

-- Add the correct foreign key constraint pointing to sales_agents table
ALTER TABLE public.lead_distribution_logs 
ADD CONSTRAINT fk_sales_agent_id 
FOREIGN KEY (sales_agent_id) REFERENCES public.sales_agents(id);

-- Also add missing foreign key for admin_id to chat_users
ALTER TABLE public.lead_distribution_logs 
DROP CONSTRAINT IF EXISTS fk_admin_id;

ALTER TABLE public.lead_distribution_logs 
ADD CONSTRAINT fk_admin_id 
FOREIGN KEY (admin_id) REFERENCES public.chat_users(id);