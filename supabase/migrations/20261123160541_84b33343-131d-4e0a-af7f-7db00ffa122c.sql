CREATE TABLE public.hub_messenger_sends (
  user_id integer NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  conversation_kind text NOT NULL,
  conversation_id bigint NOT NULL,
  text_hash text NOT NULL,
  message_id bigint NOT NULL,
  source text NOT NULL DEFAULT 'rafiei-hub',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idempotency_key)
);
CREATE INDEX hub_messenger_sends_rate_idx ON public.hub_messenger_sends(user_id, created_at DESC);
GRANT ALL ON public.hub_messenger_sends TO service_role;
ALTER TABLE public.hub_messenger_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to hub messenger sends" ON public.hub_messenger_sends FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.hub_msg_can_access(p_user integer, p_kind text, p_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE p_kind
    WHEN 'private' THEN EXISTS (SELECT 1 FROM private_conversations c WHERE c.id = p_id AND p_user IN (c.user1_id, c.user2_id))
    WHEN 'group' THEN EXISTS (SELECT 1 FROM chat_rooms r JOIN chat_users u ON u.id = p_user
      WHERE r.id = p_id AND r.is_active IS TRUE AND u.is_approved IS TRUE
        AND (r.is_boundless_only IS NOT TRUE OR u.bedoun_marz_approved IS TRUE))
    WHEN 'support' THEN EXISTS (SELECT 1 FROM support_conversations s WHERE s.id = p_id AND s.user_id = p_user)
    ELSE false END
$$;

CREATE OR REPLACE FUNCTION public.hub_msg_conversations(p_user integer)
RETURNS TABLE(kind text, id bigint, title text, avatar_url text, peer_id integer, status text, last_activity_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'group', r.id, r.name, r.avatar_url, NULL::integer, NULL::text,
    COALESCE((SELECT max(m.created_at) FROM messenger_messages m WHERE m.room_id = r.id), r.created_at, 'epoch'::timestamptz)
  FROM chat_rooms r WHERE public.hub_msg_can_access(p_user, 'group', r.id)
  UNION ALL
  SELECT 'private', c.id, COALESCE(NULLIF(u.name, ''), 'کاربر'), u.avatar_url, u.id, NULL,
    COALESCE(c.last_message_at, c.created_at, 'epoch'::timestamptz)
  FROM private_conversations c JOIN chat_users u ON u.id = CASE WHEN c.user1_id = p_user THEN c.user2_id ELSE c.user1_id END
  WHERE p_user IN (c.user1_id, c.user2_id)
  UNION ALL
  SELECT 'support', s.id, COALESCE(NULLIF(s.subject, ''), 'پشتیبانی'), NULL, NULL, s.status,
    COALESCE(s.last_message_at, s.created_at, 'epoch'::timestamptz)
  FROM support_conversations s WHERE s.user_id = p_user
$$;

CREATE OR REPLACE FUNCTION public.hub_msg_send(p_user integer, p_kind text, p_id bigint, p_text text, p_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_hash text := md5(p_kind || ':' || p_id || ':' || p_text);
  v_prev hub_messenger_sends%ROWTYPE;
  v_msg bigint;
  v_at timestamptz;
BEGIN
  IF p_text IS NULL OR length(btrim(p_text)) = 0 OR length(p_text) > 4000 THEN RAISE EXCEPTION 'invalid_text'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user || ':' || p_key, 0));
  SELECT * INTO v_prev FROM hub_messenger_sends WHERE user_id = p_user AND idempotency_key = p_key;
  IF FOUND THEN
    IF v_prev.text_hash <> v_hash THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN jsonb_build_object('message_id', v_prev.message_id, 'duplicate', true);
  END IF;
  IF NOT public.hub_msg_can_access(p_user, p_kind, p_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF (SELECT count(*) FROM hub_messenger_sends WHERE user_id = p_user AND created_at > now() - interval '1 minute') >= 20 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;
  IF p_kind = 'private' THEN
    INSERT INTO private_messages(conversation_id, sender_id, message, message_type, is_read)
      VALUES (p_id, p_user, p_text, 'text', false) RETURNING id, created_at INTO v_msg, v_at;
  ELSIF p_kind = 'group' THEN
    INSERT INTO messenger_messages(room_id, sender_id, message, message_type)
      VALUES (p_id, p_user, p_text, 'text') RETURNING id, created_at INTO v_msg, v_at;
  ELSE
    INSERT INTO messenger_messages(conversation_id, sender_id, recipient_id, message, message_type, unread_by_support)
      VALUES (p_id, p_user, 1, p_text, 'text', true) RETURNING id, created_at INTO v_msg, v_at;
    UPDATE support_conversations SET last_message_at = COALESCE(v_at, now()), updated_at = now() WHERE id = p_id;
  END IF;
  INSERT INTO hub_messenger_sends(user_id, idempotency_key, conversation_kind, conversation_id, text_hash, message_id)
    VALUES (p_user, p_key, p_kind, p_id, v_hash, v_msg);
  RETURN jsonb_build_object('message_id', v_msg, 'duplicate', false);
END $$;

CREATE OR REPLACE FUNCTION public.hub_msg_private_start(p_user integer, p_target integer)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_user = p_target THEN RAISE EXCEPTION 'self'; END IF;
  IF NOT EXISTS (SELECT 1 FROM chat_users WHERE id = p_user AND is_approved IS TRUE) THEN RAISE EXCEPTION 'not_approved'; END IF;
  IF NOT EXISTS (SELECT 1 FROM chat_users WHERE id = p_target AND is_approved IS TRUE) THEN RAISE EXCEPTION 'target_unavailable'; END IF;
  RETURN public.get_or_create_private_conversation(p_user, p_target);
END $$;

REVOKE ALL ON FUNCTION public.hub_msg_can_access(integer, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hub_msg_conversations(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hub_msg_send(integer, text, bigint, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hub_msg_private_start(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hub_msg_can_access(integer, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.hub_msg_conversations(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.hub_msg_send(integer, text, bigint, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.hub_msg_private_start(integer, integer) TO service_role;