-- Add landing page merge option to courses table
ALTER TABLE public.courses 
ADD COLUMN use_landing_page_merge boolean NOT NULL DEFAULT false;