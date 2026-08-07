ALTER TABLE public.consultation_settings
  ADD COLUMN IF NOT EXISTS telegram_notify_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_approve_message text,
  ADD COLUMN IF NOT EXISTS telegram_reject_message text;

UPDATE public.consultation_settings
SET telegram_approve_message = COALESCE(telegram_approve_message,
'✅ <b>مشاوره شما تایید شد</b>

سلام {full_name} عزیز،
جلسه مشاوره شما در تاریخ {shamsi_date} ساعت {start_time} تایید شد.

🔗 لینک جلسه: {consultation_link}

منتظر شما هستیم 🌟'),
    telegram_reject_message = COALESCE(telegram_reject_message,
'❌ <b>مشاوره شما لغو شد</b>

سلام {full_name} عزیز،
متاسفانه جلسه مشاوره شما در تاریخ {shamsi_date} ساعت {start_time} لغو شد.

لطفا زمان دیگری رزرو کنید یا با پشتیبانی در تماس باشید.')
WHERE id = 1;