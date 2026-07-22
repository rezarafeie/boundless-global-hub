CREATE OR REPLACE FUNCTION public.tg_append_session_media(p_chat_id bigint, p_media jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.telegram_bot_sessions
     SET context = jsonb_set(
           COALESCE(context, '{}'::jsonb),
           '{media}',
           COALESCE(context->'media', '[]'::jsonb) || p_media,
           true
         ),
         updated_at = now()
   WHERE chat_id = p_chat_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.tg_append_session_media(bigint, jsonb) TO service_role, authenticated, anon;