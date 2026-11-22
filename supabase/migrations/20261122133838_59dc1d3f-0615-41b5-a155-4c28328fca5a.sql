DO $$
DECLARE target_account uuid; target_course uuid := 'b97c19b7-98d3-4891-b00f-93bfb7711487';
BEGIN
 SELECT id INTO target_account FROM public.social_accounts WHERE novinhub_account_id='210093' AND provider='instagram' AND is_active=true;
 IF target_account IS NULL THEN RAISE EXCEPTION 'Active Instagram account 210093 missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id=target_course AND price=0) THEN RAISE EXCEPTION 'Boundless Taste must be free'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.social_enrollment_rules WHERE account_id=target_account AND event_type='autoform_completed' AND trigger_value='10424') THEN
 INSERT INTO public.social_enrollment_rules (name, enabled, account_id, course_id, event_type, trigger_value, field_mapping, reply_template, missing_fields_message)
 VALUES ('مزه بدون مرز — فرم پیج رضا رفیعی', true, target_account, target_course, 'autoform_completed', '10424', '{"name":"answers.name","phone":"answers.phone","email":"answers.email"}'::jsonb, E'{name} عزیز، ثبت‌نام شما در دوره «{course_title}» انجام شد.\nفعال‌سازی پشتیبانی تلگرام: {telegram_link}\n{bale_link}', 'لطفاً فرم ثبت‌نام را با نام، شماره موبایل و ایمیل تکمیل کنید.');
 END IF;
END $$;