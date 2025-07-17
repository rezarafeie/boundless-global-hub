-- Create storage buckets for messenger files and voice messages
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('messenger-files', 'messenger-files', true),
  ('voice-messages', 'voice-messages', true);

-- Create policies for messenger files bucket
CREATE POLICY "Anyone can view messenger files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'messenger-files');

CREATE POLICY "Authenticated users can upload messenger files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'messenger-files');

CREATE POLICY "Users can update their own messenger files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'messenger-files');

CREATE POLICY "Users can delete their own messenger files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'messenger-files');

-- Create policies for voice messages bucket
CREATE POLICY "Anyone can view voice messages" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'voice-messages');

CREATE POLICY "Authenticated users can upload voice messages" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-messages');

CREATE POLICY "Users can update their own voice messages" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can delete their own voice messages" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'voice-messages');