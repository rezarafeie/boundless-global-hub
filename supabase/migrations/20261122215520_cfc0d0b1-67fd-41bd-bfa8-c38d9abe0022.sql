CREATE OR REPLACE FUNCTION public.hub_auth_lookup(p_identifier text,p_channel text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u public.chat_users; n integer; BEGIN
 IF p_channel='email' THEN
 SELECT count(*) INTO n FROM public.chat_users WHERE lower(email)=lower(p_identifier);
 SELECT * INTO u FROM public.chat_users WHERE lower(email)=lower(p_identifier) ORDER BY id LIMIT 1;
 ELSE
 SELECT count(*) INTO n FROM public.chat_users WHERE public.callcenter_normalize_phone(phone)=public.callcenter_normalize_phone(p_identifier);
 SELECT * INTO u FROM public.chat_users WHERE public.callcenter_normalize_phone(phone)=public.callcenter_normalize_phone(p_identifier) ORDER BY id LIMIT 1;
 END IF;
 IF n<>1 THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('id',u.id,'password_hash',u.password_hash,'email',u.email,'name',u.name,'phone',u.phone);
END; $$;
REVOKE ALL ON FUNCTION public.hub_auth_lookup(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hub_auth_lookup(text,text) TO service_role;