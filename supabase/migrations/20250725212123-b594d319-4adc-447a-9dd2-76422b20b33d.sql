-- Add unique constraint to gmail_credentials table
ALTER TABLE public.gmail_credentials 
ADD CONSTRAINT gmail_credentials_email_address_unique UNIQUE (email_address);