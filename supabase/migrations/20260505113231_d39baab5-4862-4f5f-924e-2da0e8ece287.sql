CREATE TABLE public.mfa_backup_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_backup_codes_user ON public.mfa_backup_codes(user_id);

ALTER TABLE public.mfa_backup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backup codes"
ON public.mfa_backup_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own backup codes used"
ON public.mfa_backup_codes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backup codes"
ON public.mfa_backup_codes FOR DELETE
USING (auth.uid() = user_id);
-- INSERT intentionally restricted — only edge function with service role can create codes.