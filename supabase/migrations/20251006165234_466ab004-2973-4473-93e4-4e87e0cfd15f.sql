-- Fix buyer_profiles SELECT policy to ensure only authenticated users can access
-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view their own buyer profile" ON public.buyer_profiles;

-- Create a new restrictive SELECT policy for authenticated users only
CREATE POLICY "Authenticated users can view their own buyer profile"
ON public.buyer_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also update the INSERT and UPDATE policies to be more explicit about authenticated users
DROP POLICY IF EXISTS "Users can insert their own buyer profile" ON public.buyer_profiles;
DROP POLICY IF EXISTS "Users can update their own buyer profile" ON public.buyer_profiles;

CREATE POLICY "Authenticated users can insert their own buyer profile"
ON public.buyer_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own buyer profile"
ON public.buyer_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);