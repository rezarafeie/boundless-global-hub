-- Add birth_year and sex to chat_users table
ALTER TABLE public.chat_users 
ADD COLUMN birth_year INTEGER,
ADD COLUMN sex TEXT CHECK (sex IN ('male', 'female'));

-- Add birth_year and sex to test_enrollments table  
ALTER TABLE public.test_enrollments
ADD COLUMN birth_year INTEGER,
ADD COLUMN sex TEXT CHECK (sex IN ('male', 'female'));