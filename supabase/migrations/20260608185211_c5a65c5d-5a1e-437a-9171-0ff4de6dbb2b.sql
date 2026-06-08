
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS rafiei_bot_followup_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS telegram_chat_id bigint,
  ADD COLUMN IF NOT EXISTS telegram_linked_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_hour_tehran smallint,
  ADD COLUMN IF NOT EXISTS followup_last_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_state text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_enrollments_followup_due
  ON public.enrollments (followup_hour_tehran, followup_last_at)
  WHERE telegram_chat_id IS NOT NULL;

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS telegram_bot_username text DEFAULT 'rafiei_bot',
  ADD COLUMN IF NOT EXISTS telegram_miniapp_base_url text DEFAULT 'https://academy.rafiei.co',
  ADD COLUMN IF NOT EXISTS telegram_followup_ai_prompt text;

UPDATE public.admin_settings
SET telegram_followup_ai_prompt = COALESCE(telegram_followup_ai_prompt,
E'شما «کوچ شخصی یادگیری آکادمی رفیعی» هستید و وظیفه‌تان دنبال‌کردن دانشجو برای کامل‌کردن دوره است.\n\nلحن: گرم، انگیزشی، کوتاه. از ایموجی استفاده کنید ولی زیاده‌روی نکنید.\nبا توجه به پیشرفت کاربر در دوره، یک پیام شخصی‌سازی‌شده فارسی بنویسید که:\n۱) وضعیت فعلی او را با مهربانی یادآور شود\n۲) دقیقاً درس بعدی پیشنهادی را معرفی کند\n۳) با یک سوال یا چالش کوتاه او را به کلیک روی دکمه ترغیب کند\n\nفقط HTML تلگرام مجاز: <b>, <i>. حداکثر ۶ خط.')
WHERE id = 1;
