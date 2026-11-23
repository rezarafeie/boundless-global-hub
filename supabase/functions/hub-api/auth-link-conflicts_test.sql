-- All synthetic fixtures roll back inside the exception subtransaction.
DO $$
DECLARE owner_id integer; duplicate_id integer; result jsonb;
BEGIN
 BEGIN
  INSERT INTO public.chat_users(name,email,phone,signup_source) VALUES('Hub link regression owner','hub-link-owner@example.invalid','09999999101','hub-link-regression') RETURNING id INTO owner_id;
  INSERT INTO public.chat_users(name,email,phone,signup_source) VALUES('Hub phone-only regression',NULL,'09999999101','hub-link-regression') RETURNING id INTO duplicate_id;
  INSERT INTO public.hub_identity_proofs(user_id,email,email_verified_at,link_authorized_until) VALUES(owner_id,'hub-link-owner@example.invalid',now(),now()+interval '5 minutes');
  result := public.hub_link_account(owner_id,'hub-link-regression-owner','hub-link-owner@example.invalid');
  IF result->>'ok' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Unconfirmed phone-only duplicate must not block linking: %',result; END IF;
  IF (SELECT hub_user_id FROM public.chat_users WHERE id=duplicate_id) IS NOT NULL THEN RAISE EXCEPTION 'Duplicate ownership changed'; END IF;
  result := public.hub_link_account(owner_id,'hub-link-regression-owner','hub-link-owner@example.invalid');
  IF result->>'ok' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Same binding must remain idempotent'; END IF;
  result := public.hub_link_account(owner_id,'hub-link-regression-other','hub-link-owner@example.invalid');
  IF result->>'error' IS DISTINCT FROM 'conflict' THEN RAISE EXCEPTION 'Live owner rebinding must conflict'; END IF;
  UPDATE public.chat_users SET hub_user_id='hub-link-regression-duplicate' WHERE id=duplicate_id;
  result := public.hub_link_account(owner_id,'hub-link-regression-owner','hub-link-owner@example.invalid');
  IF result->>'error' IS DISTINCT FROM 'conflict' THEN RAISE EXCEPTION 'Bound phone duplicate must conflict'; END IF;
  UPDATE public.chat_users SET hub_user_id=NULL WHERE id=duplicate_id;
  INSERT INTO public.hub_identity_proofs(user_id,phone,phone_verified_at) VALUES(duplicate_id,public.callcenter_normalize_phone('09999999101'),now());
  result := public.hub_link_account(owner_id,'hub-link-regression-owner','hub-link-owner@example.invalid');
  IF result->>'error' IS DISTINCT FROM 'conflict' THEN RAISE EXCEPTION 'Proven phone owner must conflict'; END IF;
  UPDATE public.hub_identity_proofs SET phone_verified_at=NULL WHERE user_id=duplicate_id;
  UPDATE public.chat_users SET email='hub-link-owner@example.invalid' WHERE id=duplicate_id;
  result := public.hub_link_account(owner_id,'hub-link-regression-owner','hub-link-owner@example.invalid');
  IF result->>'error' IS DISTINCT FROM 'conflict' THEN RAISE EXCEPTION 'Duplicate email must conflict'; END IF;
  UPDATE public.chat_users SET email=NULL WHERE id=duplicate_id;
  UPDATE public.chat_users SET hub_user_id=NULL WHERE id=owner_id;
  result := public.hub_link_account(owner_id,'hub-link-regression-owner','hub-link-owner@example.invalid');
  IF result->>'error' IS DISTINCT FROM 'proof_required' THEN RAISE EXCEPTION 'New linking must still require recent exchange'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZX001',MESSAGE='rollback successful test fixtures';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN
  RAISE NOTICE 'PASS: phone-only duplicate, idempotency, live owner, bound phone, proven phone, duplicate email, recent exchange';
 END;
END; $$;