-- Update RLS policy to allow all access for testing
DROP POLICY IF EXISTS "Authenticated users can manage short links" ON public.short_links;

-- Create a policy that allows everyone to manage short links for testing
CREATE POLICY "Anyone can manage short links" 
ON public.short_links 
FOR ALL 
USING (true)
WITH CHECK (true);