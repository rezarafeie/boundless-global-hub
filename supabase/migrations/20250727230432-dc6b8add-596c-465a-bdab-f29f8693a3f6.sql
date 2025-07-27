-- Fix infinite recursion in academy_users RLS policy
-- First, create a security definer function to safely check admin role
CREATE OR REPLACE FUNCTION public.is_academy_admin_safe(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_users 
    WHERE id = user_uuid AND role = 'admin'
  );
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON public.academy_users;

-- Recreate the policy using the security definer function
CREATE POLICY "Admins can view all users" 
ON public.academy_users 
FOR ALL
USING (public.is_academy_admin_safe(auth.uid()));

-- Also fix any other potentially problematic policies
DROP POLICY IF EXISTS "Admins can manage courses" ON public.academy_courses;
CREATE POLICY "Admins can manage courses" 
ON public.academy_courses 
FOR ALL
USING (public.is_academy_admin_safe(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.academy_enrollments;
CREATE POLICY "Admins can view all enrollments" 
ON public.academy_enrollments 
FOR ALL
USING (public.is_academy_admin_safe(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.academy_transactions;
CREATE POLICY "Admins can view all transactions" 
ON public.academy_transactions 
FOR ALL
USING (public.is_academy_admin_safe(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage course notifications" ON public.notifications;
CREATE POLICY "Admins can manage course notifications" 
ON public.notifications 
FOR ALL
USING (public.is_academy_admin_safe(auth.uid()))
WITH CHECK (public.is_academy_admin_safe(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all licenses" ON public.course_licenses;
CREATE POLICY "Admins can manage all licenses" 
ON public.course_licenses 
FOR ALL
USING (public.is_academy_admin_safe(auth.uid()));