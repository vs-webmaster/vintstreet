-- Fix seller_profiles RLS to require authentication
-- Drop the overly permissive policy that allows unauthenticated access
DROP POLICY IF EXISTS "Authenticated users can view seller profiles" ON public.seller_profiles;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view seller profiles"
ON public.seller_profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- The existing get_public_seller_info function already provides
-- a secure way for unauthenticated users to access only public
-- seller information (shop_name, description, logo, etc.)
-- without exposing sensitive data like contact_email, contact_phone,
-- tax_id, or business_license