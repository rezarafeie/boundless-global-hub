-- Create storage bucket for invoice receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-receipts', 'invoice-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoice receipts
CREATE POLICY "Anyone can view invoice receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-receipts');

CREATE POLICY "Anyone can upload invoice receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoice-receipts');

CREATE POLICY "Anyone can update invoice receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'invoice-receipts');

-- Add receipt_url to invoices if not exists
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add payment_review_status for manual payments
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_review_status TEXT DEFAULT NULL;
-- Values: 'pending_review', 'approved', 'rejected'

-- Add rejection_reason for declined payments
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rejection_reason TEXT;