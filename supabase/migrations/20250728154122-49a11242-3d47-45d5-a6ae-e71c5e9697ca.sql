-- Fix the sales_dashboard_stats view to properly calculate leads only from eligible courses
DROP VIEW IF EXISTS sales_dashboard_stats;

CREATE VIEW sales_dashboard_stats AS
WITH date_ranges AS (
  SELECT 
    CURRENT_DATE AS today,
    CURRENT_DATE - INTERVAL '1 day' AS yesterday,
    CURRENT_DATE - INTERVAL '7 days' AS week_start,
    CURRENT_DATE - INTERVAL '30 days' AS month_start
),
all_enrollments AS (
  SELECT 
    e.*,
    la.sales_agent_id,
    sa.user_id AS agent_user_id,
    cu.name AS agent_name
  FROM enrollments e
  LEFT JOIN lead_assignments la ON e.id = la.enrollment_id
  LEFT JOIN sales_agents sa ON la.sales_agent_id = sa.id
  LEFT JOIN chat_users cu ON sa.user_id = cu.id
),
leads_only AS (
  SELECT 
    e.*,
    la.sales_agent_id,
    sa.user_id AS agent_user_id,
    cu.name AS agent_name
  FROM enrollments e
  LEFT JOIN lead_assignments la ON e.id = la.enrollment_id
  LEFT JOIN sales_agents sa ON la.sales_agent_id = sa.id
  LEFT JOIN chat_users cu ON sa.user_id = cu.id
  JOIN courses c ON e.course_id = c.id
  WHERE c.use_enrollments_as_leads = true
    AND e.created_at >= COALESCE(c.lead_start_date, '1970-01-01'::timestamp)
)
SELECT 
  -- Regular enrollment stats (all enrollments regardless of lead settings)
  COUNT(*) FILTER (WHERE DATE(e.created_at) = dr.today) AS enrollments_today,
  COUNT(*) FILTER (WHERE DATE(e.created_at) = dr.yesterday) AS enrollments_yesterday,
  COUNT(*) FILTER (WHERE e.created_at >= dr.week_start) AS enrollments_week,
  COUNT(*) FILTER (WHERE e.created_at >= dr.month_start) AS enrollments_month,
  
  -- Regular revenue stats (all enrollments regardless of lead settings)
  COALESCE(SUM(e.payment_amount) FILTER (WHERE 
    DATE(e.created_at) = dr.today 
    AND e.payment_status IN ('success', 'completed')
  ), 0) AS revenue_today,
  COALESCE(SUM(e.payment_amount) FILTER (WHERE 
    DATE(e.created_at) = dr.yesterday 
    AND e.payment_status IN ('success', 'completed')
  ), 0) AS revenue_yesterday,
  COALESCE(SUM(e.payment_amount) FILTER (WHERE 
    e.created_at >= dr.week_start 
    AND e.payment_status IN ('success', 'completed')
  ), 0) AS revenue_week,
  COALESCE(SUM(e.payment_amount) FILTER (WHERE 
    e.created_at >= dr.month_start 
    AND e.payment_status IN ('success', 'completed')
  ), 0) AS revenue_month,
  
  -- Lead-specific stats (calculated separately from leads_only)
  (SELECT COUNT(*) FROM leads_only l, date_ranges dr2 
   WHERE DATE(l.created_at) = dr2.today AND l.sales_agent_id IS NOT NULL) AS leads_assigned_today,
  (SELECT COUNT(*) FROM leads_only l 
   WHERE l.sales_agent_id IS NULL) AS unassigned_leads_total,
  (SELECT COUNT(*) FROM leads_only l 
   WHERE l.sales_agent_id IS NOT NULL 
     AND NOT EXISTS (
       SELECT 1 FROM crm_notes cn 
       WHERE cn.user_id = l.chat_user_id
     )) AS untouched_leads_total
FROM all_enrollments e
CROSS JOIN date_ranges dr;