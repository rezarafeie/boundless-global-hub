-- Create black_friday_settings table
CREATE TABLE IF NOT EXISTS public.black_friday_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_enabled BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Create black_friday_discounts table for course-specific discounts
CREATE TABLE IF NOT EXISTS public.black_friday_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id)
);

-- Insert default settings row
INSERT INTO public.black_friday_settings (id, is_enabled, start_date, end_date)
VALUES (1, false, now(), now() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.black_friday_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.black_friday_discounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for black_friday_settings (read for all, write for admins only)
CREATE POLICY "Anyone can read Black Friday settings"
  ON public.black_friday_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update Black Friday settings"
  ON public.black_friday_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
    )
  );

-- RLS Policies for black_friday_discounts (read for all, write for admins only)
CREATE POLICY "Anyone can read Black Friday discounts"
  ON public.black_friday_discounts
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage Black Friday discounts"
  ON public.black_friday_discounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_black_friday_settings_updated_at
  BEFORE UPDATE ON public.black_friday_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_black_friday_discounts_updated_at
  BEFORE UPDATE ON public.black_friday_discounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();