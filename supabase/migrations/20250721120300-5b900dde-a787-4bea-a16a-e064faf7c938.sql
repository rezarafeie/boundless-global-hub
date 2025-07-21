
-- Add sale-related columns to courses table
ALTER TABLE public.courses 
ADD COLUMN is_sale_enabled boolean DEFAULT false,
ADD COLUMN sale_price numeric DEFAULT NULL,
ADD COLUMN sale_expires_at timestamp with time zone DEFAULT NULL;
