
-- Onboarding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Credit Cards
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  brand text DEFAULT '',
  last4 text DEFAULT '',
  credit_limit numeric NOT NULL DEFAULT 0,
  closing_day integer NOT NULL DEFAULT 1,
  due_day integer NOT NULL DEFAULT 10,
  color text DEFAULT '#7c3aed',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS card_id uuid;

-- Family shares
CREATE TABLE IF NOT EXISTS public.family_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  invitee_email text NOT NULL,
  invitee_id uuid,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  invite_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (owner_id, invitee_email)
);
ALTER TABLE public.family_shares ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user has accepted share from owner
CREATE OR REPLACE FUNCTION public.is_shared_viewer(_owner uuid, _viewer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_shares
    WHERE owner_id = _owner AND invitee_id = _viewer AND status = 'accepted'
  )
$$;

-- RLS policies for credit_cards (owner manages, viewer sees)
DROP POLICY IF EXISTS "Owner manages cards" ON public.credit_cards;
CREATE POLICY "Owner manages cards" ON public.credit_cards FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Viewers can read shared cards" ON public.credit_cards;
CREATE POLICY "Viewers can read shared cards" ON public.credit_cards FOR SELECT TO authenticated
  USING (public.is_shared_viewer(user_id, auth.uid()));

-- Extend entries / fixed_bills / budget_goals / profiles with read access for viewers
DROP POLICY IF EXISTS "Viewers can read shared entries" ON public.entries;
CREATE POLICY "Viewers can read shared entries" ON public.entries FOR SELECT TO authenticated
  USING (public.is_shared_viewer(user_id, auth.uid()));

DROP POLICY IF EXISTS "Viewers can read shared fixed_bills" ON public.fixed_bills;
CREATE POLICY "Viewers can read shared fixed_bills" ON public.fixed_bills FOR SELECT TO authenticated
  USING (public.is_shared_viewer(user_id, auth.uid()));

DROP POLICY IF EXISTS "Viewers can read shared budget_goals" ON public.budget_goals;
CREATE POLICY "Viewers can read shared budget_goals" ON public.budget_goals FOR SELECT TO authenticated
  USING (public.is_shared_viewer(user_id, auth.uid()));

DROP POLICY IF EXISTS "Viewers can read shared profile" ON public.profiles;
CREATE POLICY "Viewers can read shared profile" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_shared_viewer(id, auth.uid()));

-- RLS for family_shares
DROP POLICY IF EXISTS "Owner manages own shares" ON public.family_shares;
CREATE POLICY "Owner manages own shares" ON public.family_shares FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Invitee can view own shares" ON public.family_shares;
CREATE POLICY "Invitee can view own shares" ON public.family_shares FOR SELECT TO authenticated
  USING (auth.uid() = invitee_id);

DROP POLICY IF EXISTS "Invitee can accept own shares" ON public.family_shares;
CREATE POLICY "Invitee can accept own shares" ON public.family_shares FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_id) WITH CHECK (auth.uid() = invitee_id);
