-- Create sales dashboard view for analytics
CREATE OR REPLACE VIEW sales_dashboard_stats AS
WITH date_ranges AS (
  SELECT 
    CURRENT_DATE AS today,
    CURRENT_DATE - INTERVAL '1 day' AS yesterday,
    CURRENT_DATE - INTERVAL '7 days' AS week_start,
    CURRENT_DATE - INTERVAL '30 days' AS month_start
),
enrollments_with_agents AS (
  SELECT 
    e.*,
    la.sales_agent_id,
    sa.user_id as agent_user_id,
    cu.name as agent_name
  FROM enrollments e
  LEFT JOIN lead_assignments la ON e.id = la.enrollment_id
  LEFT JOIN sales_agents sa ON la.sales_agent_id = sa.id
  LEFT JOIN chat_users cu ON sa.user_id = cu.id
)
SELECT 
  -- Daily stats
  COUNT(*) FILTER (WHERE DATE(e.created_at) = dr.today) as enrollments_today,
  COUNT(*) FILTER (WHERE DATE(e.created_at) = dr.yesterday) as enrollments_yesterday,
  COUNT(*) FILTER (WHERE e.created_at >= dr.week_start) as enrollments_week,
  COUNT(*) FILTER (WHERE e.created_at >= dr.month_start) as enrollments_month,
  
  -- Revenue stats
  COALESCE(SUM(e.payment_amount) FILTER (WHERE DATE(e.created_at) = dr.today AND e.payment_status IN ('success', 'completed')), 0) as revenue_today,
  COALESCE(SUM(e.payment_amount) FILTER (WHERE DATE(e.created_at) = dr.yesterday AND e.payment_status IN ('success', 'completed')), 0) as revenue_yesterday,
  COALESCE(SUM(e.payment_amount) FILTER (WHERE e.created_at >= dr.week_start AND e.payment_status IN ('success', 'completed')), 0) as revenue_week,
  COALESCE(SUM(e.payment_amount) FILTER (WHERE e.created_at >= dr.month_start AND e.payment_status IN ('success', 'completed')), 0) as revenue_month,
  
  -- Lead assignment stats
  COUNT(*) FILTER (WHERE DATE(e.created_at) = dr.today AND e.sales_agent_id IS NOT NULL) as leads_assigned_today,
  COUNT(*) FILTER (WHERE e.sales_agent_id IS NULL) as unassigned_leads_total,
  
  -- CRM activity stats (leads with no CRM notes)
  COUNT(*) FILTER (WHERE e.sales_agent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM crm_notes cn WHERE cn.user_id = e.chat_user_id
  )) as untouched_leads_total

FROM enrollments_with_agents e
CROSS JOIN date_ranges dr;

-- Create sales agent performance view
CREATE OR REPLACE VIEW sales_agent_performance AS
WITH agent_stats AS (
  SELECT 
    sa.id as sales_agent_id,
    sa.user_id as agent_user_id,
    cu.name as agent_name,
    cu.phone as agent_phone,
    
    -- Lead assignment counts
    COUNT(la.id) as total_assigned_leads,
    COUNT(la.id) FILTER (WHERE la.status = 'claimed') as claimed_leads,
    
    -- Conversion stats
    COUNT(e.id) FILTER (WHERE e.payment_status IN ('success', 'completed')) as successful_conversions,
    COALESCE(SUM(e.payment_amount) FILTER (WHERE e.payment_status IN ('success', 'completed')), 0) as total_amount_sold,
    
    -- CRM activity (count of CRM notes)
    COUNT(DISTINCT cn.id) as crm_activities_count
    
  FROM sales_agents sa
  JOIN chat_users cu ON sa.user_id = cu.id
  LEFT JOIN lead_assignments la ON sa.id = la.sales_agent_id
  LEFT JOIN enrollments e ON la.enrollment_id = e.id
  LEFT JOIN crm_notes cn ON e.chat_user_id = cn.user_id
  WHERE sa.is_active = true
  GROUP BY sa.id, sa.user_id, cu.name, cu.phone
)
SELECT 
  *,
  CASE 
    WHEN total_assigned_leads > 0 THEN 
      ROUND((successful_conversions::numeric / total_assigned_leads::numeric) * 100, 2)
    ELSE 0
  END as conversion_rate_percentage
FROM agent_stats;

-- Create function to check if user has sales_manager role
CREATE OR REPLACE FUNCTION public.is_sales_manager(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_users 
    WHERE id = user_uuid AND role = 'sales_manager'::academy_user_role
  );
$function$;