-- Create manual payment status enum
CREATE TYPE manual_payment_status AS ENUM ('pending', 'approved', 'rejected');

-- Add payment_method column to enrollments table
ALTER TABLE public.enrollments 
ADD COLUMN payment_method text DEFAULT 'zarinpal';

-- Add manual payment columns to enrollments table
ALTER TABLE public.enrollments 
ADD COLUMN manual_payment_status manual_payment_status DEFAULT NULL,
ADD COLUMN receipt_url text DEFAULT NULL,
ADD COLUMN admin_notes text DEFAULT NULL,
ADD COLUMN approved_by text DEFAULT NULL,
ADD COLUMN approved_at timestamp with time zone DEFAULT NULL;

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', true);

-- Create storage policies for payment receipts
CREATE POLICY "Anyone can upload receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Anyone can view receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-receipts');

CREATE POLICY "Admins can delete receipts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'payment-receipts');

-- Update enrollments RLS policy to allow updates for manual payment status
CREATE POLICY "Admins can update enrollments" 
ON public.enrollments 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM chat_users 
  WHERE chat_users.id = ((auth.uid())::text)::integer 
  AND chat_users.is_messenger_admin = true
));