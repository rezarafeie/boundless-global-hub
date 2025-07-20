-- Add dollar pricing support to courses table
ALTER TABLE public.courses 
ADD COLUMN use_dollar_price BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN usd_price NUMERIC(10,2) DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.courses.use_dollar_price IS 'Whether this course uses USD pricing instead of IRR';
COMMENT ON COLUMN public.courses.usd_price IS 'Price in USD when use_dollar_price is true';