
-- Create notifications table
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  link TEXT,
  notification_type TEXT NOT NULL DEFAULT 'banner' CHECK (notification_type IN ('banner', 'floating', 'popup')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add some sample data including the war notification
INSERT INTO public.notifications (title, message, color, link, notification_type, is_active, priority) VALUES
('حالت اضطراری جنگ', '🚨 حالت اضطراری جنگ فعال شد : کلیک کنید', '#DC2626', '/solidarity', 'banner', true, 1);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
