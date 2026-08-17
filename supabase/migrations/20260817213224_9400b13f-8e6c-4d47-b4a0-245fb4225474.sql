CREATE OR REPLACE FUNCTION public.update_webinar_followup_v3(
  p_session_token text, p_id uuid, p_name text, p_enabled boolean, p_channel text,
  p_audience text, p_anchor text, p_delay_minutes integer, p_max_repeats integer,
  p_repeat_delay_minutes integer, p_email_subject text, p_email_body text, p_sms_text text,
  p_sms_template_url text, p_bot_text text, p_schedule_mode text, p_priority integer,
  p_min_interval_minutes integer, p_do_not_send_after_webinar_start boolean,
  p_quiet_hours_start integer, p_quiet_hours_end integer, p_final_lead_minutes integer,
  p_media_url text, p_media_type text, p_buttons jsonb
)
RETURNS public.webinar_followups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_row public.webinar_followups;
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);
  UPDATE public.webinar_followups SET
    name = p_name,
    enabled = p_enabled,
    channel = p_channel,
    audience = p_audience,
    anchor = p_anchor,
    delay_minutes = COALESCE(p_delay_minutes, 0),
    max_repeats = COALESCE(p_max_repeats, 1),
    repeat_delay_minutes = COALESCE(p_repeat_delay_minutes, 1440),
    email_subject = p_email_subject,
    email_body = p_email_body,
    sms_text = p_sms_text,
    sms_template_url = p_sms_template_url,
    bot_text = p_bot_text,
    schedule_mode = COALESCE(p_schedule_mode, 'fixed'),
    priority = COALESCE(p_priority, 100),
    min_interval_minutes = COALESCE(p_min_interval_minutes, 30),
    do_not_send_after_webinar_start = COALESCE(p_do_not_send_after_webinar_start, true),
    quiet_hours_start = p_quiet_hours_start,
    quiet_hours_end = p_quiet_hours_end,
    final_lead_minutes = COALESCE(p_final_lead_minutes, 15),
    media_url = p_media_url,
    media_type = p_media_type,
    buttons = COALESCE(p_buttons, '[]'::jsonb),
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'پیگیری پیدا نشد';
  END IF;
  RETURN v_row;
END;
$function$;