ALTER TABLE public.profiles 
ADD COLUMN subscription_ended_at timestamp with time zone DEFAULT NULL,
ADD COLUMN data_deletion_notified boolean DEFAULT false;