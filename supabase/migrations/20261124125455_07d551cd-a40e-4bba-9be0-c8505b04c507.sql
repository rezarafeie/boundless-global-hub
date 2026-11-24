GRANT SELECT ON public.black_friday_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.black_friday_services TO authenticated;
GRANT ALL ON public.black_friday_services TO service_role;