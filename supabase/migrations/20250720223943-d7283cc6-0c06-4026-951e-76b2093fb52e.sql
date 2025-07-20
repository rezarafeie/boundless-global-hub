-- Create course_licenses table for user license management
CREATE TABLE public.course_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  license_key TEXT,
  license_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.course_licenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own licenses" 
ON public.course_licenses 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own licenses" 
ON public.course_licenses 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own licenses" 
ON public.course_licenses 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all licenses" 
ON public.course_licenses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.academy_users au
    WHERE au.id = auth.uid() 
    AND au.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_course_licenses_updated_at
BEFORE UPDATE ON public.course_licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_course_licenses_user_id ON public.course_licenses(user_id);
CREATE INDEX idx_course_licenses_course_id ON public.course_licenses(course_id);
CREATE INDEX idx_course_licenses_status ON public.course_licenses(status);