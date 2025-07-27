
-- Add sales_agent to existing role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sales_agent' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE app_role ADD VALUE 'sales_agent';
    END IF;
END $$;

-- Create lead assignments table
CREATE TABLE IF NOT EXISTS public.lead_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    sales_agent_id INTEGER NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by INTEGER REFERENCES public.chat_users(id),
    status TEXT NOT NULL DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(enrollment_id, sales_agent_id)
);

-- Create sales agent course access table
CREATE TABLE IF NOT EXISTS public.sales_agent_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_agent_id INTEGER NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES public.chat_users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(sales_agent_id, course_id)
);

-- Enable RLS on new tables
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_agent_courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_assignments
CREATE POLICY "Sales agents can view their assigned leads"
    ON public.lead_assignments
    FOR SELECT
    USING (
        sales_agent_id IN (
            SELECT us.user_id 
            FROM user_sessions us 
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_sessions us ON ur.user_id = us.user_id
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
            AND ur.role_name = 'admin'
            AND ur.is_active = true
        )
    );

CREATE POLICY "Admins can manage all lead assignments"
    ON public.lead_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_sessions us ON ur.user_id = us.user_id
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
            AND ur.role_name = 'admin'
            AND ur.is_active = true
        )
    );

CREATE POLICY "Sales agents can insert their own lead assignments"
    ON public.lead_assignments
    FOR INSERT
    WITH CHECK (
        sales_agent_id IN (
            SELECT us.user_id 
            FROM user_sessions us 
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
        )
    );

CREATE POLICY "Sales agents can update their assigned leads"
    ON public.lead_assignments
    FOR UPDATE
    USING (
        sales_agent_id IN (
            SELECT us.user_id 
            FROM user_sessions us 
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_sessions us ON ur.user_id = us.user_id
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
            AND ur.role_name = 'admin'
            AND ur.is_active = true
        )
    );

-- RLS policies for sales_agent_courses
CREATE POLICY "Sales agents can view their assigned courses"
    ON public.sales_agent_courses
    FOR SELECT
    USING (
        sales_agent_id IN (
            SELECT us.user_id 
            FROM user_sessions us 
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_sessions us ON ur.user_id = us.user_id
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
            AND ur.role_name = 'admin'
            AND ur.is_active = true
        )
    );

CREATE POLICY "Admins can manage sales agent courses"
    ON public.sales_agent_courses
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_sessions us ON ur.user_id = us.user_id
            WHERE us.session_token = current_setting('app.session_token', true)
            AND us.is_active = true
            AND ur.role_name = 'admin'
            AND ur.is_active = true
        )
    );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_assignments_updated_at
    BEFORE UPDATE ON public.lead_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
