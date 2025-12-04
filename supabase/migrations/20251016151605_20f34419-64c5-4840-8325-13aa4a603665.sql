-- Add is_blocked column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Create an index for faster queries on blocked status
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON public.profiles(is_blocked);

-- Add a comment explaining the column
COMMENT ON COLUMN public.profiles.is_blocked IS 'Indicates whether the user has been blocked by administrators';