-- Adjust auctions RLS to allow sellers, admins, and super_admins via user_roles
DROP POLICY IF EXISTS "Sellers or admins can create auctions" ON public.auctions;
DROP POLICY IF EXISTS "Sellers or admins can update auctions" ON public.auctions;

CREATE POLICY "Sellers or admins can create auctions"
ON public.auctions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = auctions.listing_id
    AND listings.seller_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Sellers or admins can update auctions"
ON public.auctions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = auctions.listing_id
    AND listings.seller_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);