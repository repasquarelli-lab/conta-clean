CREATE OR REPLACE FUNCTION public.has_app_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (_user_id = auth.uid() OR auth.role() = 'service_role') AND (
    public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _user_id AND u.created_at > now() - interval '3 days')
    OR EXISTS (SELECT 1 FROM public.subscription_access s WHERE s.user_id = _user_id AND s.paid_until > now())
  );
$$;