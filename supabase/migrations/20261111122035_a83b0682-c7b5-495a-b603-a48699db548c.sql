CREATE OR REPLACE FUNCTION public.callcenter_claim_outgoing(agent_user bigint,customer_phone text) RETURNS SETOF public.calls LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
PERFORM pg_advisory_xact_lock(hashtext('call-outgoing-'||agent_user::text||'-'||customer_phone));
IF EXISTS(SELECT 1 FROM public.calls WHERE agent_id=agent_user AND destination_number_normalized=customer_phone AND direction='outgoing' AND created_at>now()-interval '2 minutes' AND source='crm_click_reservation') THEN RETURN; END IF;
RETURN QUERY INSERT INTO public.calls(provider,provider_call_id,direction,status,agent_id,destination_number_normalized,source,processing_status) VALUES('daftareshoma','pending-'||gen_random_uuid()::text,'outgoing','initiated',agent_user,customer_phone,'crm_click_reservation','pending') RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.callcenter_claim_outgoing(bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.callcenter_claim_outgoing(bigint,text) TO service_role;