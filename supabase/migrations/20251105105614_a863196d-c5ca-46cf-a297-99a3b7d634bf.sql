-- Add suspension field to seller_profiles
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_seller_profiles_suspended 
ON public.seller_profiles(is_suspended) 
WHERE is_suspended = true;

-- Add suspended_at timestamp to track when suspension occurred
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

-- Add suspension_reason to track why shop was suspended
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS suspension_reason text;