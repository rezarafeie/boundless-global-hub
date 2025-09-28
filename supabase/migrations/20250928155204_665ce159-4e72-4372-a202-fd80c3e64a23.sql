-- Create webinar_entries table
CREATE TABLE public.webinar_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    webinar_link TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webinar_signups table
CREATE TABLE public.webinar_signups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mobile_number TEXT NOT NULL,
    webinar_id UUID NOT NULL REFERENCES public.webinar_entries(id) ON DELETE CASCADE,
    signup_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webinar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_signups ENABLE ROW LEVEL SECURITY;

-- RLS policies for webinar_entries
CREATE POLICY "Anyone can view webinars" 
ON public.webinar_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage webinars" 
ON public.webinar_entries 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS policies for webinar_signups  
CREATE POLICY "Anyone can signup for webinars"
ON public.webinar_signups 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all signups"
ON public.webinar_signups 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_webinar_entries_updated_at
BEFORE UPDATE ON public.webinar_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_webinar_entries_slug ON public.webinar_entries(slug);
CREATE INDEX idx_webinar_signups_webinar_id ON public.webinar_signups(webinar_id);
CREATE INDEX idx_webinar_signups_signup_time ON public.webinar_signups(signup_time);