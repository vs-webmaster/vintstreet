-- Drop existing policies on auctions table
DROP POLICY IF EXISTS "Sellers can create auctions for their listings" ON public.auctions;
DROP POLICY IF EXISTS "Sellers can update their own auctions" ON public.auctions;

-- Create new policies that allow both sellers and admins
CREATE POLICY "Sellers or admins can create auctions"
ON public.auctions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = auctions.listing_id
    AND listings.seller_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_type = 'admin'
  )
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
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);