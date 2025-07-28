-- Remove duplicate enrollments based on course_id, email, and phone
-- Keep the earliest enrollment (by created_at) for each combination

WITH duplicate_enrollments AS (
  SELECT 
    id,
    course_id,
    email,
    phone,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY course_id, LOWER(TRIM(email)), TRIM(phone) 
      ORDER BY created_at ASC
    ) as row_num
  FROM public.enrollments
  WHERE email IS NOT NULL 
    AND phone IS NOT NULL 
    AND TRIM(email) != '' 
    AND TRIM(phone) != ''
)
DELETE FROM public.enrollments 
WHERE id IN (
  SELECT id 
  FROM duplicate_enrollments 
  WHERE row_num > 1
);

-- Also remove any lead assignments for deleted enrollments
DELETE FROM public.lead_assignments 
WHERE enrollment_id NOT IN (
  SELECT id FROM public.enrollments
);