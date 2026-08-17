ALTER TABLE public.webinar_followups ADD COLUMN IF NOT EXISTS media_items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.support_activation_custom_followups ADD COLUMN IF NOT EXISTS media_items jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.update_webinar_followup_v4(
  p_session_token text, p_id uuid, p_name text, p_enabled boolean, p_channel text,
  p_audience text, p_anchor text, p_delay_minutes integer, p_max_repeats integer,
  p_repeat_delay_minutes integer, p_email_subject text, p_email_body text, p_sms_text text,
  p_sms_template_url text, p_bot_text text, p_schedule_mode text, p_priority integer,
  p_min_interval_minutes integer, p_do_not_send_after_webinar_start boolean,
  p_quiet_hours_start integer, p_quiet_hours_end integer, p_final_lead_minutes integer,
  p_media_url text, p_media_type text, p_buttons jsonb, p_media_items jsonb
)
RETURNS public.webinar_followups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.webinar_followups;
BEGIN
  PERFORM public.assert_webinar_followup_admin(p_session_token);

  UPDATE public.webinar_followups SET
    name = p_name,
    enabled = p_enabled,
    channel = p_channel,
    audience = p_audience,
    anchor = p_anchor,
    delay_minutes = p_delay_minutes,
    max_repeats = p_max_repeats,
    repeat_delay_minutes = p_repeat_delay_minutes,
    email_subject = p_email_subject,
    email_body = p_email_body,
    sms_text = p_sms_text,
    sms_template_url = p_sms_template_url,
    bot_text = p_bot_text,
    schedule_mode = p_schedule_mode,
    priority = p_priority,
    min_interval_minutes = p_min_interval_minutes,
    do_not_send_after_webinar_start = p_do_not_send_after_webinar_start,
    quiet_hours_start = p_quiet_hours_start,
    quiet_hours_end = p_quiet_hours_end,
    final_lead_minutes = p_final_lead_minutes,
    media_url = p_media_url,
    media_type = p_media_type,
    buttons = COALESCE(p_buttons, '[]'::jsonb),
    media_items = COALESCE(p_media_items, '[]'::jsonb),
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_webinar_followup_v4(text, uuid, text, boolean, text, text, text, integer, integer, integer, text, text, text, text, text, text, integer, integer, boolean, integer, integer, integer, text, text, jsonb, jsonb) TO anon, authenticated, service_role;