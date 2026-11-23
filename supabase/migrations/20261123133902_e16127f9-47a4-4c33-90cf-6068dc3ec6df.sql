CREATE OR REPLACE FUNCTION public.hub_link_account(p_user_id integer,p_hub_user_id text,p_email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u public.chat_users; e text := lower(btrim(p_email)); r jsonb; BEGIN
 IF e IS NULL OR e='' OR p_hub_user_id IS NULL OR btrim(p_hub_user_id)='' THEN RETURN jsonb_build_object('error','account_mismatch'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('hub-link',0));
 SELECT * INTO u FROM public.chat_users WHERE id=p_user_id FOR UPDATE;
 -- The shared-secret-verified Hub email is the proof: the source account must be exactly what account.resolve returns for it.
 r := public.hub_account_resolve(e);
 IF r ? 'error' THEN RETURN jsonb_build_object('error','conflict'); END IF;
 IF u.id IS NULL OR r->>'source_user_id' IS DISTINCT FROM u.id::text THEN RETURN jsonb_build_object('error','account_mismatch'); END IF;
 IF (u.hub_user_id IS NOT NULL AND u.hub_user_id<>p_hub_user_id)
 OR EXISTS(SELECT 1 FROM public.chat_users c WHERE c.id<>u.id AND (
 c.hub_user_id=p_hub_user_id OR lower(btrim(c.email))=e OR
 (u.phone IS NOT NULL AND public.callcenter_normalize_phone(c.phone)=public.callcenter_normalize_phone(u.phone)
 AND (NULLIF(btrim(c.email),'') IS NOT NULL OR c.hub_user_id IS NOT NULL OR EXISTS(SELECT 1 FROM public.hub_identity_proofs cp WHERE cp.user_id=c.id AND (cp.email_verified_at IS NOT NULL OR cp.phone_verified_at IS NOT NULL))))))
 OR EXISTS(SELECT 1 FROM public.academy_users a WHERE a.hub_user_id=p_hub_user_id OR lower(btrim(a.email))=e OR (u.phone IS NOT NULL AND public.callcenter_normalize_phone(a.phone)=public.callcenter_normalize_phone(u.phone))) THEN RETURN jsonb_build_object('error','conflict'); END IF;
 INSERT INTO public.hub_identity_proofs(user_id,email,email_verified_at) VALUES(u.id,e,now())
 ON CONFLICT (user_id) DO UPDATE SET email=EXCLUDED.email, email_verified_at=COALESCE(CASE WHEN public.hub_identity_proofs.email=EXCLUDED.email THEN public.hub_identity_proofs.email_verified_at END, now()), link_authorized_until=NULL, updated_at=now();
 IF u.hub_user_id=p_hub_user_id THEN RETURN jsonb_build_object('ok',true,'user_id',u.id); END IF;
 UPDATE public.chat_users SET hub_user_id=p_hub_user_id WHERE id=u.id;
 UPDATE public.enrollments SET chat_user_id=u.id WHERE chat_user_id IS NULL AND lower(btrim(email))=e AND phone IS NULL;
 UPDATE public.test_enrollments SET user_id=u.id WHERE user_id IS NULL AND lower(btrim(email))=e AND phone IS NULL;
 RETURN jsonb_build_object('ok',true,'user_id',u.id);
END; $$;
REVOKE ALL ON FUNCTION public.hub_link_account(integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hub_link_account(integer,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.hub_resolve_user(p_hub_user_id text, p_email text, p_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE u public.chat_users; BEGIN
 -- Name is accepted for contract compatibility but never used for matching.
 SELECT c.* INTO u FROM public.chat_users c JOIN public.hub_identity_proofs p ON p.user_id=c.id
 WHERE c.hub_user_id=p_hub_user_id AND lower(btrim(c.email))=lower(btrim(p_email)) AND p.email=lower(btrim(c.email)) AND p.email_verified_at IS NOT NULL;
 IF u.id IS NULL THEN RAISE EXCEPTION 'Verified account link required'; END IF;
 RETURN jsonb_build_object('id',u.id,'email',u.email,'name',u.name,'phone',u.phone,'hub_user_id',u.hub_user_id);
END; $function$;
REVOKE ALL ON FUNCTION public.hub_resolve_user(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hub_resolve_user(text,text,text) TO service_role;