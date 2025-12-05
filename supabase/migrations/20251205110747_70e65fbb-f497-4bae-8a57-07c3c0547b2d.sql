-- Fix sales agent performance view to only count actual conversions
-- (enrollments where payment happened AFTER assignment or via agent's invoice)

CREATE OR REPLACE VIEW sales_agent_performance AS
SELECT 
  sa.id as sales_agent_id,
  sa.user_id as agent_user_id,
  cu.name as agent_name,
  cu.phone as agent_phone,
  
  -- Lead assignment counts
  (SELECT COUNT(DISTINCT la2.id) FROM lead_assignments la2 WHERE la2.sales_agent_id = sa.id) as total_assigned_leads,
  (SELECT COUNT(DISTINCT la2.id) FROM lead_assignments la2 WHERE la2.sales_agent_id = sa.id AND la2.status = 'claimed') as claimed_leads,
  
  -- Successful conversions: only count paid invoices by this agent
  (SELECT COUNT(DISTINCT i.id) FROM invoices i WHERE i.sales_agent_id = cu.id AND i.status = 'paid') as successful_conversions,
  
  -- Total amount sold: only from paid invoices by agent
  COALESCE((SELECT SUM(i.total_amount) FROM invoices i WHERE i.sales_agent_id = cu.id AND i.status = 'paid'), 0) as total_amount_sold,
  
  -- CRM activity (count of CRM notes by this agent)
  (SELECT COUNT(DISTINCT cn.id) FROM crm_notes cn WHERE cn.created_by = cu.id::text) as crm_activities_count,
  
  -- Conversion rate based on invoices vs assigned leads
  CASE 
    WHEN (SELECT COUNT(DISTINCT la2.id) FROM lead_assignments la2 WHERE la2.sales_agent_id = sa.id) > 0 THEN 
      ROUND(
        ((SELECT COUNT(DISTINCT i.id) FROM invoices i WHERE i.sales_agent_id = cu.id AND i.status = 'paid')::numeric 
        / (SELECT COUNT(DISTINCT la2.id) FROM lead_assignments la2 WHERE la2.sales_agent_id = sa.id)::numeric) * 100, 
        2
      )
    ELSE 0
  END as conversion_rate_percentage
  
FROM sales_agents sa
JOIN chat_users cu ON sa.user_id = cu.id
WHERE sa.is_active = true;