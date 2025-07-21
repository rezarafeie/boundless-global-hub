-- Add course_id column to notifications table for course-specific notifications
ALTER TABLE public.notifications 
ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Create index for better performance when querying course-specific notifications
CREATE INDEX idx_notifications_course_id ON public.notifications(course_id);

-- Update RLS policies to handle course-specific notifications
CREATE POLICY "Users can view course notifications for enrolled courses" 
ON public.notifications 
FOR SELECT 
USING (
  course_id IS NULL OR -- Global notifications are visible to everyone
  EXISTS (
    SELECT 1 
    FROM public.enrollments e 
    WHERE e.course_id = notifications.course_id 
    AND e.payment_status IN ('completed', 'success')
    AND e.email = (auth.jwt() ->> 'email')
  )
);

-- Allow admins to manage course-specific notifications
CREATE POLICY "Admins can manage course notifications" 
ON public.notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.academy_users au 
    WHERE au.id = auth.uid() 
    AND au.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.academy_users au 
    WHERE au.id = auth.uid() 
    AND au.role = 'admin'
  )
);