-- Consultation Settings Table
CREATE TABLE public.consultation_settings (
  id integer PRIMARY KEY DEFAULT 1,
  slot_duration integer NOT NULL DEFAULT 20,
  webhook_url text,
  default_confirmation_message text DEFAULT 'مشاوره شما تایید شد. لطفا در زمان مقرر حاضر باشید.',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Consultation Slots Table
CREATE TABLE public.consultation_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_by integer REFERENCES public.chat_users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Consultation Bookings Table
CREATE TABLE public.consultation_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.chat_users(id),
  slot_id uuid NOT NULL REFERENCES public.consultation_slots(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  confirmed_by integer REFERENCES public.chat_users(id),
  confirmed_at timestamp with time zone,
  confirmation_note text,
  consultation_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.consultation_settings (id, slot_duration) VALUES (1, 20);

-- Enable RLS
ALTER TABLE public.consultation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultation_settings
CREATE POLICY "Anyone can view settings" ON public.consultation_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.consultation_settings FOR UPDATE USING (true);

-- RLS Policies for consultation_slots
CREATE POLICY "Anyone can view available slots" ON public.consultation_slots FOR SELECT USING (true);
CREATE POLICY "Admins can manage slots" ON public.consultation_slots FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for consultation_bookings
CREATE POLICY "Users can view own bookings" ON public.consultation_bookings FOR SELECT USING (true);
CREATE POLICY "Users can create bookings" ON public.consultation_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage bookings" ON public.consultation_bookings FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_consultation_slots_date ON public.consultation_slots(date);
CREATE INDEX idx_consultation_bookings_status ON public.consultation_bookings(status);
CREATE INDEX idx_consultation_bookings_user ON public.consultation_bookings(user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_consultation_settings_updated_at
  BEFORE UPDATE ON public.consultation_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_slots_updated_at
  BEFORE UPDATE ON public.consultation_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_bookings_updated_at
  BEFORE UPDATE ON public.consultation_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();