
-- Create a table for Rafiei Meet settings
CREATE TABLE public.rafiei_meet_settings (
  id integer NOT NULL DEFAULT 1 PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT false,
  title text DEFAULT 'جلسه تصویری رفیعی',
  description text DEFAULT 'جلسه تصویری زنده برای اعضای بدون مرز',
  meet_url text DEFAULT 'https://meet.jit.si/rafiei',
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default row
INSERT INTO public.rafiei_meet_settings (id, is_active, title, description, meet_url) 
VALUES (1, false, 'جلسه تصویری رفیعی', 'جلسه تصویری زنده برای اعضای بدون مرز', 'https://meet.jit.si/rafiei')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.rafiei_meet_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view rafiei meet settings" ON public.rafiei_meet_settings
  FOR SELECT USING (true);

-- Allow service role to update
CREATE POLICY "Service role can update rafiei meet settings" ON public.rafiei_meet_settings
  FOR UPDATE USING (true);

-- Enable realtime for rafiei_meet_settings
ALTER TABLE public.rafiei_meet_settings REPLICA IDENTITY FULL;
