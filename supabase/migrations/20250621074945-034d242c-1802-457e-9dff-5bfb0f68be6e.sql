
-- Enable Row Level Security for chat_topics table
ALTER TABLE public.chat_topics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for chat topics
CREATE POLICY "Anyone can view active chat topics" 
  ON public.chat_topics 
  FOR SELECT 
  USING (is_active = true);

-- Create policy to allow admin operations (you'll need to implement admin authentication)
-- For now, allowing all operations - you can restrict this later with proper admin roles
CREATE POLICY "Allow all operations on chat topics" 
  ON public.chat_topics 
  FOR ALL 
  USING (true);
