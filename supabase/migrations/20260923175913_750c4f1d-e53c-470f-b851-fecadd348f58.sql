UPDATE public.course_gamification_settings
SET enabled = true,
    updated_at = now()
WHERE course_id = 'b97c19b7-98d3-4891-b00f-93bfb7711487';