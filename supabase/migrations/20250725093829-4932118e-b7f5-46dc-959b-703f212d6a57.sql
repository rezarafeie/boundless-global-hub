-- Add course_id column to webhook_configurations table to support course-specific webhooks
ALTER TABLE public.webhook_configurations 
ADD COLUMN course_id uuid REFERENCES public.courses(id);

-- Add index for better performance when filtering by course
CREATE INDEX idx_webhook_configurations_course_id ON public.webhook_configurations(course_id);

-- Add a comment to explain the nullable course_id
COMMENT ON COLUMN public.webhook_configurations.course_id IS 'If null, webhook applies to all courses. If set, webhook only applies to the specific course.';

-- Insert the specific webhook for boundless-taste course
-- First, let's get the course ID for boundless-taste
INSERT INTO public.webhook_configurations (
  name,
  url,
  event_type,
  course_id,
  is_active,
  headers,
  body_template,
  created_by
) 
SELECT 
  'Boundless Taste - ثبت نام جدید',
  'https://hook.us1.make.com/bb8t1ssqc4m4lps6djp06xp1edr5xvvt',
  'enrollment_created',
  c.id,
  true,
  '{}',
  '{
    "event_type": "{{event_type}}",
    "timestamp": "{{timestamp}}",
    "course": {
      "id": "{{data.course.id}}",
      "title": "{{data.course.title}}",
      "slug": "{{data.course.slug}}",
      "price": "{{data.course.price}}"
    },
    "enrollment": {
      "id": "{{data.enrollment.id}}",
      "created_at": "{{data.enrollment.created_at}}",
      "payment_status": "{{data.enrollment.payment_status}}",
      "payment_amount": "{{data.enrollment.payment_amount}}"
    },
    "user": {
      "id": "{{data.user.id}}",
      "name": "{{data.user.name}}",
      "email": "{{data.user.email}}",
      "phone": "{{data.user.phone}}"
    },
    "license": "{{data.license}}",
    "sso_tokens": "{{data.sso_tokens}}"
  }',
  1
FROM public.courses c 
WHERE c.slug = 'boundless-taste';

-- Also add webhook for payment success for boundless-taste
INSERT INTO public.webhook_configurations (
  name,
  url,
  event_type,
  course_id,
  is_active,
  headers,
  body_template,
  created_by
) 
SELECT 
  'Boundless Taste - پرداخت موفق',
  'https://hook.us1.make.com/bb8t1ssqc4m4lps6djp06xp1edr5xvvt',
  'enrollment_paid_successful',
  c.id,
  true,
  '{}',
  '{
    "event_type": "{{event_type}}",
    "timestamp": "{{timestamp}}",
    "course": {
      "id": "{{data.course.id}}",
      "title": "{{data.course.title}}",
      "slug": "{{data.course.slug}}",
      "price": "{{data.course.price}}"
    },
    "enrollment": {
      "id": "{{data.enrollment.id}}",
      "created_at": "{{data.enrollment.created_at}}",
      "payment_status": "{{data.enrollment.payment_status}}",
      "payment_amount": "{{data.enrollment.payment_amount}}"
    },
    "user": {
      "id": "{{data.user.id}}",
      "name": "{{data.user.name}}",
      "email": "{{data.user.email}}",
      "phone": "{{data.user.phone}}"
    },
    "license": "{{data.license}}",
    "sso_tokens": "{{data.sso_tokens}}"
  }',
  1
FROM public.courses c 
WHERE c.slug = 'boundless-taste';