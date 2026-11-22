-- Hosted rate-limit regression: synthetic buckets are rolled back, not retained.
DO $$
DECLARE tag text := 'qa-'||gen_random_uuid()::text; i integer; passed boolean:=false;
BEGIN
 BEGIN
  FOR i IN 1..5 LOOP
   IF NOT public.hub_auth_rate(tag,5,3600,0) THEN RAISE EXCEPTION 'Hourly send allowed fewer than five'; END IF;
  END LOOP;
  IF public.hub_auth_rate(tag,5,3600,0) THEN RAISE EXCEPTION 'Sixth hourly send was allowed'; END IF;
  IF NOT public.hub_auth_rate(tag||'-gap',5,3600,60) THEN RAISE EXCEPTION 'First send blocked'; END IF;
  IF public.hub_auth_rate(tag||'-gap',5,3600,60) THEN RAISE EXCEPTION '60 second resend gap bypassed'; END IF;
  IF NOT public.hub_auth_rate(tag||'-abuse',1,60,0) THEN RAISE EXCEPTION 'First independent abuse attempt blocked'; END IF;
  IF public.hub_auth_rate(tag||'-abuse',1,60,0) THEN RAISE EXCEPTION 'Independent abuse bucket bypassed'; END IF;
  passed:=true;
  RAISE EXCEPTION USING ERRCODE='P9999', MESSAGE='QA rollback';
 EXCEPTION WHEN SQLSTATE 'P9999' THEN NULL;
 END;
 IF NOT passed THEN RAISE EXCEPTION 'Rate tests did not complete'; END IF;
END $$;