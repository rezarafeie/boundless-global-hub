
-- Create sales agents table
CREATE TABLE public.sales_agents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.chat_users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sales agent courses table (defines which courses a sales agent can see leads for)
CREATE TABLE public.sales_agent_courses (
  id SERIAL PRIMARY KEY,
  sales_agent_id INTEGER REFERENCES public.sales_agents(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sales_agent_id, course_id)
);

-- Create lead assignments table
CREATE TABLE public.lead_assignments (
  id SERIAL PRIMARY KEY,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  sales_agent_id INTEGER REFERENCES public.sales_agents(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES public.chat_users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'assigned',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(enrollment_id)
);

-- Enable RLS on all tables
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_agent_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_agents
CREATE POLICY "Admins can manage sales agents" ON public.sales_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_users 
      WHERE id = auth.uid()::integer AND is_messenger_admin = true
    )
  );

CREATE POLICY "Sales agents can view their own record" ON public.sales_agents
  FOR SELECT USING (user_id = auth.uid()::integer);

-- RLS policies for sales_agent_courses
CREATE POLICY "Admins can manage sales agent courses" ON public.sales_agent_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_users 
      WHERE id = auth.uid()::integer AND is_messenger_admin = true
    )
  );

CREATE POLICY "Sales agents can view their assigned courses" ON public.sales_agent_courses
  FOR SELECT USING (
    sales_agent_id IN (
      SELECT id FROM public.sales_agents WHERE user_id = auth.uid()::integer
    )
  );

-- RLS policies for lead_assignments
CREATE POLICY "Admins can manage lead assignments" ON public.lead_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_users 
      WHERE id = auth.uid()::integer AND is_messenger_admin = true
    )
  );

CREATE POLICY "Sales agents can view their assigned leads" ON public.lead_assignments
  FOR SELECT USING (
    sales_agent_id IN (
      SELECT id FROM public.sales_agents WHERE user_id = auth.uid()::integer
    )
  );

CREATE POLICY "Sales agents can update their assigned leads" ON public.lead_assignments
  FOR UPDATE USING (
    sales_agent_id IN (
      SELECT id FROM public.sales_agents WHERE user_id = auth.uid()::integer
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_sales_agent_courses(agent_user_id INTEGER)
RETURNS TABLE(course_id UUID, course_title TEXT, course_slug TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.slug
  FROM public.sales_agent_courses sac
  JOIN public.sales_agents sa ON sac.sales_agent_id = sa.id
  JOIN public.courses c ON sac.course_id = c.id
  WHERE sa.user_id = agent_user_id
    AND sa.is_active = true
    AND c.is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_courses_for_sales_agent(agent_user_id INTEGER)
RETURNS TABLE(
  enrollment_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  course_title TEXT,
  payment_status TEXT,
  payment_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  is_assigned BOOLEAN,
  assigned_to_agent TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.full_name,
    e.email,
    e.phone,
    c.title,
    e.payment_status,
    e.payment_amount,
    e.created_at,
    (la.id IS NOT NULL) as is_assigned,
    CASE 
      WHEN la.id IS NOT NULL THEN cu.name
      ELSE NULL
    END as assigned_to_agent
  FROM public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  JOIN public.sales_agent_courses sac ON c.id = sac.course_id
  JOIN public.sales_agents sa ON sac.sales_agent_id = sa.id
  LEFT JOIN public.lead_assignments la ON e.id = la.enrollment_id
  LEFT JOIN public.sales_agents assigned_sa ON la.sales_agent_id = assigned_sa.id
  LEFT JOIN public.chat_users cu ON assigned_sa.user_id = cu.id
  WHERE sa.user_id = agent_user_id
    AND sa.is_active = true
    AND e.payment_status IN ('success', 'completed')
  ORDER BY e.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_lead_to_agent(
  p_enrollment_id UUID,
  p_agent_user_id INTEGER,
  p_assigned_by INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_id INTEGER;
BEGIN
  -- Get sales agent id
  SELECT id INTO agent_id
  FROM public.sales_agents
  WHERE user_id = p_agent_user_id AND is_active = true;
  
  IF agent_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert assignment
  INSERT INTO public.lead_assignments (enrollment_id, sales_agent_id, assigned_by)
  VALUES (p_enrollment_id, agent_id, p_assigned_by)
  ON CONFLICT (enrollment_id) DO UPDATE SET
    sales_agent_id = agent_id,
    assigned_by = p_assigned_by,
    assigned_at = now(),
    updated_at = now();
    
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_lead_assignments(agent_user_id INTEGER)
RETURNS TABLE(
  assignment_id INTEGER,
  enrollment_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  course_title TEXT,
  payment_amount NUMERIC,
  assigned_at TIMESTAMP WITH TIME ZONE,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.id,
    e.id,
    e.full_name,
    e.email,
    e.phone,
    c.title,
    e.payment_amount,
    la.assigned_at,
    la.status
  FROM public.lead_assignments la
  JOIN public.sales_agents sa ON la.sales_agent_id = sa.id
  JOIN public.enrollments e ON la.enrollment_id = e.id
  JOIN public.courses c ON e.course_id = c.id
  WHERE sa.user_id = agent_user_id
    AND sa.is_active = true
  ORDER BY la.assigned_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_courses_to_sales_agent(
  p_agent_user_id INTEGER,
  p_course_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_id INTEGER;
  course_id UUID;
BEGIN
  -- Get or create sales agent
  SELECT id INTO agent_id
  FROM public.sales_agents
  WHERE user_id = p_agent_user_id;
  
  IF agent_id IS NULL THEN
    INSERT INTO public.sales_agents (user_id)
    VALUES (p_agent_user_id)
    RETURNING id INTO agent_id;
  END IF;
  
  -- Remove existing course assignments
  DELETE FROM public.sales_agent_courses
  WHERE sales_agent_id = agent_id;
  
  -- Add new course assignments
  FOREACH course_id IN ARRAY p_course_ids
  LOOP
    INSERT INTO public.sales_agent_courses (sales_agent_id, course_id)
    VALUES (agent_id, course_id)
    ON CONFLICT (sales_agent_id, course_id) DO NOTHING;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_sales_agent_lead_access(
  p_agent_user_id INTEGER,
  p_enrollment_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.lead_assignments la
    JOIN public.sales_agents sa ON la.sales_agent_id = sa.id
    WHERE sa.user_id = p_agent_user_id
      AND la.enrollment_id = p_enrollment_id
      AND sa.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_course_from_sales_agent(
  p_agent_user_id INTEGER,
  p_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_id INTEGER;
BEGIN
  -- Get sales agent id
  SELECT id INTO agent_id
  FROM public.sales_agents
  WHERE user_id = p_agent_user_id;
  
  IF agent_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remove course assignment
  DELETE FROM public.sales_agent_courses
  WHERE sales_agent_id = agent_id AND course_id = p_course_id;
  
  RETURN TRUE;
END;
$$;
