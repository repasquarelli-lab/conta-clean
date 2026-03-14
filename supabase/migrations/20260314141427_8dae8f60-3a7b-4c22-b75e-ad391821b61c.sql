ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS custom_categories jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS custom_income_categories jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"enabled":true,"dueTodayAlert":true,"overdueAlert":true,"dueSoonAlert":true}'::jsonb;