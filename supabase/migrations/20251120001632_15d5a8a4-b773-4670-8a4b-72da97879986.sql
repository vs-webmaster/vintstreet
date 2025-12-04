-- Allow admins and super_admins to update listings (Master Products)
DROP POLICY IF EXISTS "Admins and super_admins can update all listings" ON public.listings;
DROP POLICY IF EXISTS "Sellers can update their own listings" ON public.listings;

-- Sellers can update their own listings
CREATE POLICY "Sellers can update their own listings"
ON public.listings
FOR UPDATE
USING (seller_id = auth.uid());

-- Admins and super_admins can update all listings
CREATE POLICY "Admins and super_admins can update all listings"
ON public.listings
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);