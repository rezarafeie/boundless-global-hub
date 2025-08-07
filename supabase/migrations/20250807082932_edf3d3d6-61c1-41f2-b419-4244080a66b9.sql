-- Add birth_year and sex to chat_users table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_users' AND column_name = 'birth_year') THEN
        ALTER TABLE public.chat_users ADD COLUMN birth_year INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_users' AND column_name = 'sex') THEN
        ALTER TABLE public.chat_users ADD COLUMN sex TEXT CHECK (sex IN ('male', 'female'));
    END IF;
END $$;

-- Add sex to test_enrollments table (birth_year already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_enrollments' AND column_name = 'sex') THEN
        ALTER TABLE public.test_enrollments ADD COLUMN sex TEXT CHECK (sex IN ('male', 'female'));
    END IF;
END $$;