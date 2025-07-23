-- Update RLS policy to allow any authenticated user to manage short links for now
DROP POLICY IF EXISTS "Admins can manage all short links" ON public.short_links;

-- Create a more permissive policy for testing
CREATE POLICY "Authenticated users can manage short links" 
ON public.short_links 
FOR ALL 
USING (auth.role() = 'authenticated');