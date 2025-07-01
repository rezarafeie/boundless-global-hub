
-- Create enum types for the academy system
CREATE TYPE academy_user_role AS ENUM ('student', 'admin');
CREATE TYPE course_type AS ENUM ('free', 'paid');
CREATE TYPE course_status AS ENUM ('active', 'closed', 'full');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'completed');
CREATE TYPE transaction_status AS ENUM ('success', 'pending', 'failed');

-- Create academy_users table
CREATE TABLE public.academy_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role academy_user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create academy_courses table
CREATE TABLE public.academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type course_type NOT NULL DEFAULT 'free',
  price NUMERIC(10,2) DEFAULT 0,
  status course_status NOT NULL DEFAULT 'active',
  redirect_after_enroll TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create academy_enrollments table
CREATE TABLE public.academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.academy_users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Create academy_transactions table
CREATE TABLE public.academy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.academy_users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  gateway TEXT NOT NULL DEFAULT 'zarinpal',
  status transaction_status NOT NULL DEFAULT 'pending',
  gateway_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create academy_settings table
CREATE TABLE public.academy_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  use_old_auth_system BOOLEAN NOT NULL DEFAULT true,
  enrollment_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO public.academy_settings (id, use_old_auth_system, enrollment_enabled) 
VALUES (1, true, true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.academy_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academy_users
CREATE POLICY "Users can view their own profile" ON public.academy_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.academy_users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Anyone can insert users" ON public.academy_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all users" ON public.academy_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.academy_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for academy_courses
CREATE POLICY "Anyone can view active courses" ON public.academy_courses
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage courses" ON public.academy_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.academy_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for academy_enrollments
CREATE POLICY "Users can view their own enrollments" ON public.academy_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own enrollments" ON public.academy_enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all enrollments" ON public.academy_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.academy_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for academy_transactions
CREATE POLICY "Users can view their own transactions" ON public.academy_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own transactions" ON public.academy_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON public.academy_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.academy_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for academy_settings
CREATE POLICY "Anyone can view settings" ON public.academy_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON public.academy_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.academy_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_academy_users_updated_at BEFORE UPDATE ON public.academy_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_courses_updated_at BEFORE UPDATE ON public.academy_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_settings_updated_at BEFORE UPDATE ON public.academy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions
CREATE OR REPLACE FUNCTION get_academy_user_role(user_uuid UUID)
RETURNS academy_user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.academy_users WHERE id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION is_academy_admin(user_uuid UUID)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_users 
    WHERE id = user_uuid AND role = 'admin'
  );
$$;
