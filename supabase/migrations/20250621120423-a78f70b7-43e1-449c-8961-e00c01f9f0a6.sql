
-- Add media columns to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Update existing records to have empty media_url if null
UPDATE public.announcements 
SET media_url = '' 
WHERE media_url IS NULL;
