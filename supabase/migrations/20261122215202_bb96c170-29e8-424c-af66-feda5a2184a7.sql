CREATE TABLE public.hub_auth_requests (id uuid PRIMARY KEY, user_id integer REFERENCES public.chat_users(id), channel text NOT NULL, destination_hash text NOT NULL, code_hash text NOT NULL, verified_email text, expires_at timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 0, consumed_at timestamptz, delivered boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.hub_auth_requests TO service_role;
ALTER TABLE public.hub_auth_requests ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.hub_exchange_tickets (ticket_hash text PRIMARY KEY, user_id integer NOT NULL REFERENCES public.chat_users(id), audience text NOT NULL, expires_at timestamptz NOT NULL, authenticated_at timestamptz NOT NULL DEFAULT now(), consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.hub_exchange_tickets TO service_role;
ALTER TABLE public.hub_exchange_tickets ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.hub_identity_proofs (user_id integer PRIMARY KEY REFERENCES public.chat_users(id), email text, email_verified_at timestamptz, phone text, phone_verified_at timestamptz, link_authorized_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.hub_identity_proofs TO service_role;
ALTER TABLE public.hub_identity_proofs ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.hub_auth_limits (bucket text PRIMARY KEY, hits timestamptz[] NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.hub_auth_limits TO service_role;
ALTER TABLE public.hub_auth_limits ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.hub_auth_readiness (method text PRIMARY KEY, verified_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.hub_auth_readiness TO service_role;
ALTER TABLE public.hub_auth_readiness ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.hub_auth_touch() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at:=now(); RETURN NEW; END; $$;
CREATE TRIGGER hub_proof_touch BEFORE UPDATE ON public.hub_identity_proofs FOR EACH ROW EXECUTE FUNCTION public.hub_auth_touch();
CREATE TRIGGER hub_limit_touch BEFORE UPDATE ON public.hub_auth_limits FOR EACH ROW EXECUTE FUNCTION public.hub_auth_touch();
CREATE OR REPLACE FUNCTION public.hub_auth_rate(p_bucket text,p_max integer,p_window integer,p_gap integer DEFAULT 0) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.hub_auth_limits; recent timestamptz[]; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('hub-rate:'||p_bucket,0));
 INSERT INTO public.hub_auth_limits(bucket) VALUES(p_bucket) ON CONFLICT DO NOTHING;
 SELECT * INTO b FROM public.hub_auth_limits WHERE bucket=p_bucket FOR UPDATE;
 SELECT coalesce(array_agg(t ORDER BY t),'{}') INTO recent FROM unnest(b.hits) t WHERE t>now()-make_interval(secs=>p_window);
 IF cardinality(recent)>=p_max OR (p_gap>0 AND recent[cardinality(recent)]>now()-make_interval(secs=>p_gap)) THEN RETURN false; END IF;
 UPDATE public.hub_auth_limits SET hits=array_append(recent,now()) WHERE bucket=p_bucket; RETURN true;
END; $$;
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
  IF r.verified_email IS NULL OR (u.email IS NOT NULL AND lower(u.email)<>r.verified_email) OR EXISTS(SELECT 1 FROM public.chat_users WHERE id<>u.id AND lower(email)=r.verified_email) OR EXISTS(SELECT 1 FROM public.academy_users WHERE lower(email)=r.verified_email AND hub_user_id IS DISTINCT FROM u.hub_user_id) THEN RETURN jsonb_build_object('error','conflict'); END IF;
  UPDATE public.chat_users SET email=r.verified_email WHERE id=u.id AND email IS NULL;
  INSERT INTO public.hub_identity_proofs(user_id,email,email_verified_at) VALUES(u.id,r.verified_email,now()) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,email_verified_at=now();
 ELSE
  IF public.callcenter_normalize_phone(u.phone) IS NULL THEN RETURN jsonb_build_object('error','conflict'); END IF;
  INSERT INTO public.hub_identity_proofs(user_id,phone,phone_verified_at) VALUES(u.id,public.callcenter_normalize_phone(u.phone),now()) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,phone_verified_at=now();
 END IF;
 INSERT INTO public.hub_exchange_tickets(ticket_hash,user_id,audience,expires_at) VALUES(p_ticket_hash,u.id,'rafiei-hub',now()+interval '60 seconds');
 RETURN jsonb_build_object('user_id',u.id);
END; $$;
CREATE OR REPLACE FUNCTION public.hub_auth_exchange(p_hash text,p_audience text,p_email_continuation boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.hub_exchange_tickets; u public.chat_users; p public.hub_identity_proofs; BEGIN
 SELECT * INTO t FROM public.hub_exchange_tickets WHERE ticket_hash=p_hash FOR UPDATE;
 IF NOT FOUND OR t.consumed_at IS NOT NULL OR t.expires_at<=now() OR t.audience<>p_audience OR p_audience<>'rafiei-hub' THEN RETURN jsonb_build_object('error','invalid'); END IF;
 SELECT * INTO u FROM public.chat_users WHERE id=t.user_id FOR UPDATE;
 SELECT * INTO p FROM public.hub_identity_proofs WHERE user_id=t.user_id FOR UPDATE;
 IF NOT p_email_continuation AND (u.email IS NULL OR p.email_verified_at IS NULL OR lower(u.email) IS DISTINCT FROM p.email) THEN RETURN jsonb_build_object('error','email_required'); END IF;
 UPDATE public.hub_exchange_tickets SET consumed_at=now() WHERE ticket_hash=p_hash;
 IF p_email_continuation THEN RETURN jsonb_build_object('user_id',u.id); END IF;
 UPDATE public.hub_identity_proofs SET link_authorized_until=now()+interval '5 minutes' WHERE user_id=u.id;
 RETURN jsonb_build_object('source_user_id',u.id::text,'email',u.email,'email_verified',true,'name',u.name,'phone',CASE WHEN public.callcenter_normalize_phone(u.phone) ~ '^9[0-9]{9}$' THEN '+98'||public.callcenter_normalize_phone(u.phone) ELSE NULL END,'phone_verified',p.phone_verified_at IS NOT NULL AND p.phone=public.callcenter_normalize_phone(u.phone),'authenticated_at',t.authenticated_at,'audience',t.audience);
END; $$;
CREATE OR REPLACE FUNCTION public.hub_link_account(p_user_id integer,p_hub_user_id text,p_email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u public.chat_users; p public.hub_identity_proofs; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('hub-link',0));
 SELECT * INTO u FROM public.chat_users WHERE id=p_user_id FOR UPDATE;
 SELECT * INTO p FROM public.hub_identity_proofs WHERE user_id=p_user_id FOR UPDATE;
 IF u.id IS NULL OR p.email_verified_at IS NULL OR p.link_authorized_until IS NULL OR p.link_authorized_until<=now() OR lower(u.email) IS DISTINCT FROM lower(p_email) OR p.email IS DISTINCT FROM lower(p_email) THEN RETURN jsonb_build_object('error','proof_required'); END IF;
 IF (u.hub_user_id IS NOT NULL AND u.hub_user_id<>p_hub_user_id) OR EXISTS(SELECT 1 FROM public.chat_users WHERE id<>u.id AND (hub_user_id=p_hub_user_id OR lower(email)=lower(p_email) OR (u.phone IS NOT NULL AND public.callcenter_normalize_phone(phone)=public.callcenter_normalize_phone(u.phone)))) OR EXISTS(SELECT 1 FROM public.academy_users WHERE lower(email)=lower(p_email) OR (u.phone IS NOT NULL AND public.callcenter_normalize_phone(phone)=public.callcenter_normalize_phone(u.phone))) THEN RETURN jsonb_build_object('error','conflict'); END IF;
 UPDATE public.chat_users SET hub_user_id=p_hub_user_id WHERE id=u.id;
 UPDATE public.hub_identity_proofs SET link_authorized_until=NULL WHERE user_id=u.id;
 UPDATE public.enrollments SET chat_user_id=u.id WHERE chat_user_id IS NULL AND ((lower(email)=p.email) OR (p.phone_verified_at IS NOT NULL AND p.phone=public.callcenter_normalize_phone(phone))) AND (email IS NULL OR lower(email)=p.email) AND (phone IS NULL OR (p.phone_verified_at IS NOT NULL AND p.phone=public.callcenter_normalize_phone(phone)));
 UPDATE public.test_enrollments SET user_id=u.id WHERE user_id IS NULL AND lower(email)=p.email AND (phone IS NULL OR (p.phone_verified_at IS NOT NULL AND p.phone=public.callcenter_normalize_phone(phone)));
 RETURN jsonb_build_object('ok',true,'user_id',u.id);
END; $$;
CREATE OR REPLACE FUNCTION public.hub_resolve_user(p_hub_user_id text,p_email text,p_name text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u public.chat_users; BEGIN
 SELECT c.* INTO u FROM public.chat_users c JOIN public.hub_identity_proofs p ON p.user_id=c.id WHERE c.hub_user_id=p_hub_user_id AND lower(c.email)=lower(trim(p_email)) AND p.email=lower(c.email) AND p.email_verified_at IS NOT NULL;
 IF u.id IS NULL THEN RAISE EXCEPTION 'Verified account link required'; END IF;
 RETURN jsonb_build_object('id',u.id,'email',u.email,'name',u.name,'phone',u.phone,'hub_user_id',u.hub_user_id);
END; $$;
REVOKE ALL ON FUNCTION public.hub_auth_rate(text,integer,integer,integer),public.hub_auth_verify(uuid,text,text),public.hub_auth_exchange(text,text,boolean),public.hub_link_account(integer,text,text),public.hub_resolve_user(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hub_auth_rate(text,integer,integer,integer),public.hub_auth_verify(uuid,text,text),public.hub_auth_exchange(text,text,boolean),public.hub_link_account(integer,text,text),public.hub_resolve_user(text,text,text) TO service_role;