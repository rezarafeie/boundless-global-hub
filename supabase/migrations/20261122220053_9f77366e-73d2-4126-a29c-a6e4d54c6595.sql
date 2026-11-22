ALTER TABLE public.hub_auth_requests ADD COLUMN verified_phone text;
CREATE OR REPLACE FUNCTION public.hub_auth_verify(p_id uuid,p_code_hash text,p_ticket_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.hub_auth_requests; u public.chat_users; BEGIN
 SELECT * INTO r FROM public.hub_auth_requests WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR r.consumed_at IS NOT NULL OR r.expires_at<=now() OR r.attempts>=5 OR NOT r.delivered THEN RETURN jsonb_build_object('error','invalid'); END IF;
 UPDATE public.hub_auth_requests SET attempts=attempts+1 WHERE id=p_id;
 IF r.code_hash<>p_code_hash THEN RETURN jsonb_build_object('error','invalid'); END IF;
 UPDATE public.hub_auth_requests SET consumed_at=now() WHERE id=p_id;
 IF r.user_id IS NULL THEN RETURN jsonb_build_object('error','account_unavailable'); END IF;
 SELECT * INTO u FROM public.chat_users WHERE id=r.user_id FOR UPDATE;
 IF r.channel='email' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('hub-email-proof:'||r.verified_email,0));
  IF r.verified_email IS NULL OR (u.email IS NOT NULL AND lower(u.email)<>r.verified_email) OR EXISTS(SELECT 1 FROM public.chat_users WHERE id<>u.id AND lower(email)=r.verified_email) OR EXISTS(SELECT 1 FROM public.academy_users WHERE lower(email)=r.verified_email AND hub_user_id IS DISTINCT FROM u.hub_user_id) THEN RETURN jsonb_build_object('error','conflict'); END IF;
  UPDATE public.chat_users SET email=r.verified_email WHERE id=u.id AND email IS NULL;
  INSERT INTO public.hub_identity_proofs(user_id,email,email_verified_at) VALUES(u.id,r.verified_email,now()) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,email_verified_at=now();
 ELSE
  IF r.verified_phone IS NULL OR r.verified_phone IS DISTINCT FROM public.callcenter_normalize_phone(u.phone) THEN RETURN jsonb_build_object('error','conflict'); END IF;
  INSERT INTO public.hub_identity_proofs(user_id,phone,phone_verified_at) VALUES(u.id,r.verified_phone,now()) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,phone_verified_at=now();
 END IF;
 INSERT INTO public.hub_exchange_tickets(ticket_hash,user_id,audience,expires_at) VALUES(p_ticket_hash,u.id,'rafiei-hub',now()+interval '60 seconds');
 RETURN jsonb_build_object('user_id',u.id);
END; $$;