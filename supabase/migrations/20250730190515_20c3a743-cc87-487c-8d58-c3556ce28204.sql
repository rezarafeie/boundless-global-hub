-- Link existing boundless course leads assigned to sales agents to boundless-full course as deals

INSERT INTO public.deals (
  enrollment_id,
  course_id,
  price,
  assigned_salesperson_id,
  assigned_by_id,
  status,
  created_at,
  updated_at
)
SELECT DISTINCT
  e.id as enrollment_id,
  (SELECT id FROM public.courses WHERE slug = 'boundless-full' LIMIT 1) as course_id,
  COALESCE(e.payment_amount, 0) as price,
  sa.user_id as assigned_salesperson_id,
  la.assigned_by as assigned_by_id,
  CASE 
    WHEN e.payment_status IN ('success', 'completed') THEN 'won'
    WHEN e.payment_status = 'cancelled_payment' THEN 'lost'
    ELSE 'in_progress'
  END as status,
  e.created_at,
  now() as updated_at
FROM public.enrollments e
JOIN public.lead_assignments la ON e.id = la.enrollment_id
JOIN public.sales_agents sa ON la.sales_agent_id = sa.id
JOIN public.courses c ON e.course_id = c.id
WHERE c.slug LIKE '%boundless%'
  AND NOT EXISTS (
    SELECT 1 FROM public.deals d WHERE d.enrollment_id = e.id
  )
  AND sa.is_active = true;