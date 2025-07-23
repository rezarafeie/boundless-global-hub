-- Create short_links table for URL shortener
CREATE TABLE public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Create policies for short links
CREATE POLICY "Admins can manage all short links" 
ON public.short_links 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM chat_users 
  WHERE id = (auth.uid()::text)::integer 
  AND is_messenger_admin = true
));

CREATE POLICY "Anyone can view short links for redirects" 
ON public.short_links 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_short_links_updated_at
BEFORE UPDATE ON public.short_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment clicks
CREATE OR REPLACE FUNCTION public.increment_short_link_clicks(link_slug text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.short_links 
  SET clicks = clicks + 1 
  WHERE slug = link_slug;
END;
$$;