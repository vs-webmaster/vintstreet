-- Fix seller_profiles RLS to protect sensitive business data
-- Drop the overly permissive policy that allows all authenticated users to see sensitive data
DROP POLICY IF EXISTS "Authenticated users can view seller profiles" ON public.seller_profiles;

-- Keep the policy that allows sellers to view their own complete profile
-- This policy already exists: "Sellers can view their own profile"
-- It uses: USING (auth.uid() = user_id)

-- For public access to non-sensitive seller info, use the existing
-- get_public_seller_info(uuid) function which only returns:
-- - shop_name, shop_description, shop_logo_url
-- - business_name, return_policy, shipping_policy
-- WITHOUT exposing: contact_email, contact_phone, tax_id, business_license