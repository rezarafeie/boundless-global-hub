
-- Link existing enrollments to chat_users by phone number
UPDATE public.enrollments 
SET chat_user_id = (
  SELECT cu.id 
  FROM public.chat_users cu 
  WHERE cu.phone = enrollments.phone 
  LIMIT 1
)
WHERE chat_user_id IS NULL;

-- Function to create chat_user from enrollment data
CREATE OR REPLACE FUNCTION public.create_user_from_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id INTEGER;
  existing_user_id INTEGER;
  generated_user_id TEXT;
BEGIN
  -- Check if user already exists by phone
  SELECT id INTO existing_user_id 
  FROM public.chat_users 
  WHERE phone = NEW.phone;
  
  -- If user doesn't exist, create one
  IF existing_user_id IS NULL THEN
    -- Generate unique user_id
    generated_user_id := public.generate_unique_user_id();
    
    -- Create new chat_user
    INSERT INTO public.chat_users (
      name,
      phone,
      email,
      first_name,
      last_name,
      full_name,
      user_id,
      country_code,
      signup_source,
      is_approved,
      role
    ) VALUES (
      NEW.full_name,
      NEW.phone,
      NEW.email,
      SPLIT_PART(NEW.full_name, ' ', 1),
      CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(NEW.full_name, ' '), 1) > 1 
        THEN ARRAY_TO_STRING(ARRAY_REMOVE(STRING_TO_ARRAY(NEW.full_name, ' '), SPLIT_PART(NEW.full_name, ' ', 1)), ' ')
        ELSE ''
      END,
      NEW.full_name,
      generated_user_id,
      COALESCE(NEW.country_code, '+98'),
      'enrollment',
      true,
      'user'
    )
    RETURNING id INTO new_user_id;
    
    -- Link the enrollment to the new user
    NEW.chat_user_id := new_user_id;
  ELSE
    -- Link to existing user
    NEW.chat_user_id := existing_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic user creation during enrollment
DROP TRIGGER IF EXISTS create_user_on_enrollment ON public.enrollments;
CREATE TRIGGER create_user_on_enrollment
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_from_enrollment();

-- Function to get user courses by phone number
CREATE OR REPLACE FUNCTION public.get_user_courses_by_phone(user_phone TEXT)
RETURNS TABLE(
  enrollment_id uuid,
  course_id uuid,
  course_title text,
  course_description text,
  course_price numeric,
  course_redirect_url text,
  enrollment_date timestamp with time zone,
  payment_status text,
  payment_amount numeric,
  spotplayer_license_key text,
  spotplayer_license_url text,
  spotplayer_license_id text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as enrollment_id,
    c.id as course_id,
    c.title as course_title,
    c.description as course_description,
    c.price as course_price,
    c.redirect_url as course_redirect_url,
    e.created_at as enrollment_date,
    e.payment_status,
    e.payment_amount,
    e.spotplayer_license_key,
    e.spotplayer_license_url,
    e.spotplayer_license_id
  FROM public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  WHERE e.phone = user_phone 
    AND e.payment_status IN ('completed', 'success')
    AND c.is_active = true
  ORDER BY e.created_at DESC;
END;
$$;

-- Function to get user licenses by phone number
CREATE OR REPLACE FUNCTION public.get_user_licenses_by_phone(user_phone TEXT)
RETURNS TABLE(
  license_id uuid,
  course_id uuid,
  course_title text,
  license_key text,
  license_data jsonb,
  license_status text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  activated_at timestamp with time zone,
  enrollment_id uuid
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Get Rafiei player licenses from enrollments
  SELECT 
    e.id as license_id,
    c.id as course_id,
    c.title as course_title,
    e.spotplayer_license_key as license_key,
    jsonb_build_object(
      'license_id', e.spotplayer_license_id,
      'license_url', e.spotplayer_license_url,
      'type', 'spotplayer'
    ) as license_data,
    CASE 
      WHEN e.spotplayer_license_key IS NOT NULL THEN 'active'
      ELSE 'pending'
    END as license_status,
    e.created_at,
    NULL::timestamp with time zone as expires_at,
    e.created_at as activated_at,
    e.id as enrollment_id
  FROM public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  WHERE e.phone = user_phone 
    AND e.payment_status IN ('completed', 'success')
    AND e.spotplayer_license_key IS NOT NULL
    AND c.is_active = true
  
  UNION ALL
  
  -- Get academy licenses from course_licenses table
  SELECT 
    cl.id as license_id,
    c.id as course_id,
    c.title as course_title,
    cl.license_key,
    cl.license_data,
    cl.status as license_status,
    cl.created_at,
    cl.expires_at,
    cl.activated_at,
    NULL::uuid as enrollment_id
  FROM public.course_licenses cl
  JOIN public.courses c ON cl.course_id = c.id
  JOIN public.chat_users cu ON cl.user_id::text = cu.id::text
  WHERE cu.phone = user_phone
    AND c.is_active = true
  
  ORDER BY created_at DESC;
END;
$$;
