
-- Fix RLS policies to allow anonymous users to create enrollments
-- The current policy may not work properly for anonymous users

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow public enrollment creation" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;  
DROP POLICY IF EXISTS "Admins can update enrollments" ON public.enrollments;

-- Create a policy that explicitly allows anonymous users to insert enrollments
CREATE POLICY "Allow anonymous enrollment creation" 
ON public.enrollments 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Policy for admins to view all enrollments (authenticated users only)
CREATE POLICY "Admins can view all enrollments" 
ON public.enrollments 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM chat_users 
  WHERE chat_users.id = ((auth.uid())::text)::integer 
  AND chat_users.is_messenger_admin = true
));

-- Policy for admins to update enrollments (authenticated users only)
CREATE POLICY "Admins can update enrollments" 
ON public.enrollments 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM chat_users 
  WHERE chat_users.id = ((auth.uid())::text)::integer 
  AND chat_users.is_messenger_admin = true
));

-- Also ensure storage policies allow anonymous uploads for payment receipts
DROP POLICY IF EXISTS "Anyone can upload receipts" ON storage.objects;
CREATE POLICY "Anonymous can upload payment receipts" 
ON storage.objects 
FOR INSERT 
TO anon, authenticated
WITH CHECK (bucket_id = 'payment-receipts');
