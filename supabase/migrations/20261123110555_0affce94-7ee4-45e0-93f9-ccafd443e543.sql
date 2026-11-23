CREATE OR REPLACE FUNCTION public.hub_account_resolve(p_email text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE u public.chat_users; n integer; a integer; e text := lower(btrim(p_email));
BEGIN
 IF e IS NULL OR e='' THEN RETURN jsonb_build_object('error','invalid_email'); END IF;
 SELECT count(*) INTO n FROM public.chat_users WHERE lower(btrim(email))=e;
 SELECT count(*) INTO a FROM public.academy_users WHERE lower(btrim(email))=e;
 IF n>1 OR a>0 THEN RETURN jsonb_build_object('error','conflict'); END IF;
 IF n=0 THEN RETURN jsonb_build_object('source_user_id',NULL); END IF;
 SELECT * INTO u FROM public.chat_users WHERE lower(btrim(email))=e;
 RETURN jsonb_build_object('source_user_id',u.id::text,'email',e,'email_verified',true,'name',u.name);
END; $$;
REVOKE ALL ON FUNCTION public.hub_account_resolve(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hub_account_resolve(text) TO service_role;

CREATE OR REPLACE FUNCTION public.hub_link_account(p_user_id integer,p_hub_user_id text,p_email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u public.chat_users; p public.hub_identity_proofs; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('hub-link',0));
 SELECT * INTO u FROM public.chat_users WHERE id=p_user_id FOR UPDATE;
 SELECT * INTO p FROM public.hub_identity_proofs WHERE user_id=p_user_id FOR UPDATE;
 IF u.id IS NULL OR p.email_verified_at IS NULL OR lower(u.email) IS DISTINCT FROM lower(p_email) OR p.email IS DISTINCT FROM lower(p_email) THEN RETURN jsonb_build_object('error','proof_required'); END IF;
 IF (u.hub_user_id IS NOT NULL AND u.hub_user_id<>p_hub_user_id) OR EXISTS(SELECT 1 FROM public.chat_users WHERE id<>u.id AND (hub_user_id=p_hub_user_id OR lower(email)=lower(p_email) OR (u.phone IS NOT NULL AND public.callcenter_normalize_phone(phone)=public.callcenter_normalize_phone(u.phone)))) OR EXISTS(SELECT 1 FROM public.academy_users WHERE hub_user_id=p_hub_user_id OR lower(email)=lower(p_email) OR (u.phone IS NOT NULL AND public.callcenter_normalize_phone(phone)=public.callcenter_normalize_phone(u.phone))) THEN RETURN jsonb_build_object('error','conflict'); END IF;
 -- A repeat may not renew proof, move history or change an existing owner.
 IF u.hub_user_id=p_hub_user_id THEN RETURN jsonb_build_object('ok',true,'user_id',u.id); END IF;
 IF p.link_authorized_until IS NULL OR p.link_authorized_until<=now() THEN RETURN jsonb_build_object('error','proof_required'); END IF;
 UPDATE public.chat_users SET hub_user_id=p_hub_user_id WHERE id=u.id;
 UPDATE public.hub_identity_proofs SET link_authorized_until=NULL WHERE user_id=u.id;
 UPDATE public.enrollments SET chat_user_id=u.id WHERE chat_user_id IS NULL AND ((lower(email)=p.email) OR (p.phone_verified_at IS NOT NULL AND p.phone=public.callcenter_normalize_phone(phone))) AND (email IS NULL OR lower(email)=p.email) AND (phone IS NULL OR (p.phone_verified_at IS NOT NULL AND p.phone=public.callcenter_normalize_phone(phone)));
 UPDATE public.test_enrollments SET user_id=u.id WHERE user_id IS NULL AND lower(email)=p.email AND (phone IS NULL OR (p.phone_verified_at IS NOT NULL AND p.phone=public.callcenter_normalize_phone(phone)));
 RETURN jsonb_build_object('ok',true,'user_id',u.id);
END; $$;
REVOKE ALL ON FUNCTION public.hub_link_account(integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hub_link_account(integer,text,text) TO service_role;