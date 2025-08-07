-- Add receipt_url column to test_enrollments table for manual payment receipts
ALTER TABLE public.test_enrollments ADD COLUMN receipt_url TEXT;