ALTER TABLE public.chat_users ADD COLUMN IF NOT EXISTS hub_user_id text;
ALTER TABLE public.academy_users ADD COLUMN IF NOT EXISTS hub_user_id text;
ALTER TABLE public.chat_users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.test_enrollments ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.support_conversations ADD COLUMN IF NOT EXISTS subject text, ADD COLUMN IF NOT EXISTS initial_message text;
CREATE UNIQUE INDEX IF NOT EXISTS chat_users_hub_user_id_key ON public.chat_users(hub_user_id) WHERE hub_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS academy_users_hub_user_id_key ON public.academy_users(hub_user_id) WHERE hub_user_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.protect_hub_user_identity() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF (TG_OP='INSERT' AND NEW.hub_user_id IS NOT NULL) OR (TG_OP='UPDATE' AND NEW.hub_user_id IS DISTINCT FROM OLD.hub_user_id) THEN
  IF COALESCE(auth.role(),'') <> 'service_role' AND current_user NOT IN ('postgres','supabase_admin') THEN RAISE EXCEPTION 'Hub identity is server-managed'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER protect_chat_hub_identity BEFORE INSERT OR UPDATE ON public.chat_users FOR EACH ROW EXECUTE FUNCTION public.protect_hub_user_identity();
CREATE TRIGGER protect_academy_hub_identity BEFORE INSERT OR UPDATE ON public.academy_users FOR EACH ROW EXECUTE FUNCTION public.protect_hub_user_identity();
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
 RETURN jsonb_build_object('id',u.id,'email',u.email,'name',u.name,'phone',u.phone,'hub_user_id',u.hub_user_id);
END; $$;
REVOKE ALL ON FUNCTION public.hub_resolve_user(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hub_resolve_user(text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.create_user_from_enrollment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE existing_user_id integer; new_user_id integer;
BEGIN
 IF NEW.chat_user_id IS NOT NULL THEN
  IF EXISTS(SELECT 1 FROM public.chat_users WHERE id=NEW.chat_user_id) THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Enrollment user does not exist';
 END IF;
 IF NEW.phone IS NOT NULL THEN SELECT id INTO existing_user_id FROM public.chat_users WHERE phone=NEW.phone; END IF;
 IF existing_user_id IS NULL AND NEW.email IS NOT NULL THEN SELECT id INTO existing_user_id FROM public.chat_users WHERE lower(email)=lower(NEW.email) ORDER BY id LIMIT 1; END IF;
 IF existing_user_id IS NULL THEN
  INSERT INTO public.chat_users(name,phone,email,first_name,last_name,full_name,user_id,country_code,signup_source,is_approved)
  VALUES(NEW.full_name,NEW.phone,NEW.email,split_part(NEW.full_name,' ',1),'',NEW.full_name,public.generate_unique_user_id(),coalesce(NEW.country_code,'+98'),'enrollment',true) RETURNING id INTO new_user_id;
  NEW.chat_user_id:=new_user_id;
 ELSE NEW.chat_user_id:=existing_user_id;
 END IF;
 RETURN NEW;
END; $$;