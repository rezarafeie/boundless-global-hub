CREATE POLICY hub_auth_requests_server ON public.hub_auth_requests FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY hub_exchange_tickets_server ON public.hub_exchange_tickets FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY hub_identity_proofs_server ON public.hub_identity_proofs FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY hub_auth_limits_server ON public.hub_auth_limits FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY hub_auth_readiness_server ON public.hub_auth_readiness FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE INDEX hub_auth_requests_user_idx ON public.hub_auth_requests(user_id);
CREATE INDEX hub_exchange_tickets_user_idx ON public.hub_exchange_tickets(user_id);
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
 RETURN jsonb_build_object('source_user_id',u.id::text,'email',u.email,'email_verified',true,'name',u.name,'phone',CASE WHEN public.callcenter_normalize_phone(u.phone) ~ '^989[0-9]{9}$' THEN '+'||public.callcenter_normalize_phone(u.phone) ELSE NULL END,'phone_verified',p.phone_verified_at IS NOT NULL AND p.phone=public.callcenter_normalize_phone(u.phone),'authenticated_at',t.authenticated_at,'audience',t.audience);
END; $$;