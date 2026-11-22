CREATE OR REPLACE FUNCTION public.hub_resolve_user(p_hub_user_id text,p_email text,p_name text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u public.chat_users; a public.academy_users; mail text:=lower(trim(p_email));
BEGIN
 IF length(p_hub_user_id) NOT BETWEEN 1 AND 200 OR length(mail) NOT BETWEEN 3 AND 254 OR mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(trim(p_name)) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Invalid Hub identity'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('hub-id:'||p_hub_user_id,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('hub-email:'||mail,0));
 SELECT * INTO u FROM public.chat_users WHERE hub_user_id=p_hub_user_id;
 IF FOUND AND lower(u.email) IS DISTINCT FROM mail THEN RAISE EXCEPTION 'Hub identity conflict'; END IF;
 SELECT * INTO u FROM public.chat_users WHERE lower(email)=mail ORDER BY id LIMIT 1 FOR UPDATE;
 IF FOUND AND u.hub_user_id IS NOT NULL AND u.hub_user_id<>p_hub_user_id THEN RAISE EXCEPTION 'Hub identity conflict'; END IF;
 SELECT * INTO a FROM public.academy_users WHERE lower(email)=mail ORDER BY created_at LIMIT 1 FOR UPDATE;
 IF FOUND AND a.hub_user_id IS NOT NULL AND a.hub_user_id<>p_hub_user_id THEN RAISE EXCEPTION 'Hub identity conflict'; END IF;
 IF u.id IS NULL THEN
  INSERT INTO public.chat_users(name,full_name,first_name,last_name,email,phone,signup_source,hub_user_id,is_approved)
  VALUES(trim(p_name),trim(p_name),split_part(trim(p_name),' ',1),'',mail,a.phone,'rafiei-hub',p_hub_user_id,true) RETURNING * INTO u;
 ELSE
  UPDATE public.chat_users SET hub_user_id=p_hub_user_id WHERE id=u.id RETURNING * INTO u;
 END IF;
 IF a.id IS NOT NULL THEN UPDATE public.academy_users SET hub_user_id=p_hub_user_id WHERE id=a.id; END IF;
 UPDATE public.enrollments SET chat_user_id=u.id WHERE chat_user_id IS NULL AND lower(email)=mail;
 UPDATE public.test_enrollments SET user_id=u.id WHERE user_id IS NULL AND lower(email)=mail;
 RETURN jsonb_build_object('id',u.id,'email',u.email,'name',u.name,'phone',u.phone,'hub_user_id',u.hub_user_id);
END; $$;
REVOKE ALL ON FUNCTION public.hub_resolve_user(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hub_resolve_user(text,text,text) TO service_role;