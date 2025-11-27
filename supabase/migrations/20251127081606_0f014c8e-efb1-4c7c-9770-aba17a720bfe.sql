-- Allow anyone to update Black Friday settings and discounts

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can update Black Friday settings" ON black_friday_settings;
DROP POLICY IF EXISTS "Admins can manage Black Friday discounts" ON black_friday_discounts;

-- Create open policies for Black Friday settings
CREATE POLICY "Anyone can update Black Friday settings"
ON black_friday_settings
FOR UPDATE
USING (true);

-- Create open policies for Black Friday discounts
CREATE POLICY "Anyone can manage Black Friday discounts"
ON black_friday_discounts
FOR ALL
USING (true)
WITH CHECK (true);