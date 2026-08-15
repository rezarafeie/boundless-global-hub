DELETE FROM public.notifications
WHERE title IN ('تماس از دست رفته')
   OR message LIKE 'تماس بی‌پاسخ از%'
   OR message LIKE 'تماس نیازمند توجه:%';