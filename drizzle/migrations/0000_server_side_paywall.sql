CREATE TABLE public.subscription_access (
  user_id uuid PRIMARY KEY,
  paid_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_access TO authenticated;
GRANT ALL ON public.subscription_access TO service_role;
ALTER TABLE public.subscription_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own access" ON public.subscription_access FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_app_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _user_id AND u.created_at > now() - interval '3 days')
    OR EXISTS (SELECT 1 FROM public.subscription_access s WHERE s.user_id = _user_id AND s.paid_until > now());
$$;
REVOKE EXECUTE ON FUNCTION public.has_app_access(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_app_access(uuid) TO authenticated;

DO $$
DECLARE t text; p text;
BEGIN
  FOR t, p IN SELECT * FROM (VALUES
    ('entries','Users manage own entries'),
    ('fixed_bills','Users manage own fixed_bills'),
    ('budget_goals','Users manage own budget_goals'),
    ('goals','Users manage own goals'),
    ('credit_cards','Owner manages cards')) v(t,p)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
    EXECUTE format('CREATE POLICY "Owner reads own" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Paid owner inserts" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_app_access(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Paid owner updates" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.has_app_access(auth.uid())) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Paid owner deletes" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.has_app_access(auth.uid()))', t);
  END LOOP;
END $$;