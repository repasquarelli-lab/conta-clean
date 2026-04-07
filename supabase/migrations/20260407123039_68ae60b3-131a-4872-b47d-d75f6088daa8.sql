
-- Fix 1: Restrict referrals UPDATE to service_role only
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;

CREATE POLICY "Service role can update referrals"
ON public.referrals
FOR UPDATE
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Fix 2: Add storage RLS policies for the private bucket
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'rjfgcoexdksqbxubocbs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'rjfgcoexdksqbxubocbs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'rjfgcoexdksqbxubocbs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'rjfgcoexdksqbxubocbs' AND auth.uid()::text = (storage.foldername(name))[1]);
