-- Create sales agent record for user 9106815739
INSERT INTO public.sales_agents (user_id, is_active, created_at)
VALUES (36817, true, now())
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  updated_at = now();