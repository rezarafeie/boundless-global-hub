-- Create deals table for sales funnel CRM
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'won', 'lost')),
  assigned_salesperson_id INTEGER NOT NULL REFERENCES public.chat_users(id) ON DELETE RESTRICT,
  assigned_by_id INTEGER NOT NULL REFERENCES public.chat_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on deals table
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policies for deals table
CREATE POLICY "Sales agents can view assigned deals" 
ON public.deals 
FOR SELECT 
USING (
  assigned_salesperson_id IN (
    SELECT us.user_id 
    FROM public.user_sessions us 
    WHERE us.session_token = current_setting('app.session_token', true) 
    AND us.is_active = true
  )
);

CREATE POLICY "Admins and sales managers can view all deals" 
ON public.deals 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_users cu
    JOIN public.user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND (cu.is_messenger_admin = true OR cu.role = 'sales_manager')
  )
);

CREATE POLICY "System can create deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (true);

-- Create deal activities table (upgrade from crm_notes)
CREATE TABLE public.deal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES public.chat_users(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('call', 'meeting', 'message', 'note')),
  result TEXT CHECK (result IN ('success', 'no_answer', 'failed', 'canceled', 'follow_up')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on deal_activities table
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for deal_activities table
CREATE POLICY "Users can view activities for accessible deals" 
ON public.deal_activities 
FOR SELECT 
USING (
  deal_id IN (
    SELECT d.id FROM public.deals d
    WHERE d.assigned_salesperson_id IN (
      SELECT us.user_id 
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true) 
      AND us.is_active = true
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_users cu
    JOIN public.user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND (cu.is_messenger_admin = true OR cu.role = 'sales_manager')
  )
);

CREATE POLICY "Authorized users can manage deal activities" 
ON public.deal_activities 
FOR ALL 
USING (
  deal_id IN (
    SELECT d.id FROM public.deals d
    WHERE d.assigned_salesperson_id IN (
      SELECT us.user_id 
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true) 
      AND us.is_active = true
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_users cu
    JOIN public.user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND (cu.is_messenger_admin = true OR cu.role = 'sales_manager')
  )
)
WITH CHECK (
  deal_id IN (
    SELECT d.id FROM public.deals d
    WHERE d.assigned_salesperson_id IN (
      SELECT us.user_id 
      FROM public.user_sessions us 
      WHERE us.session_token = current_setting('app.session_token', true) 
      AND us.is_active = true
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_users cu
    JOIN public.user_sessions us ON cu.id = us.user_id
    WHERE us.session_token = current_setting('app.session_token', true)
    AND us.is_active = true
    AND (cu.is_messenger_admin = true OR cu.role = 'sales_manager')
  )
);

-- Create indexes for better performance
CREATE INDEX idx_deals_enrollment_id ON public.deals(enrollment_id);
CREATE INDEX idx_deals_course_id ON public.deals(course_id);
CREATE INDEX idx_deals_assigned_salesperson_id ON public.deals(assigned_salesperson_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deal_activities_deal_id ON public.deal_activities(deal_id);
CREATE INDEX idx_deal_activities_type ON public.deal_activities(type);

-- Create trigger for updating updated_at on deals
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on deal_activities  
CREATE TRIGGER update_deal_activities_updated_at
  BEFORE UPDATE ON public.deal_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();