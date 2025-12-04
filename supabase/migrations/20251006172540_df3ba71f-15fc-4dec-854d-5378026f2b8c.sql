-- Fix bids table RLS to restrict access to bidder and seller only
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.bids;

-- Create a new policy that allows:
-- 1. Bidders to view their own bids
-- 2. Sellers to view bids on their listings
CREATE POLICY "Bidders and sellers can view bids"
ON public.bids
FOR SELECT
TO authenticated
USING (
  -- User is the bidder
  auth.uid() = bidder_id
  OR
  -- User is the seller of the listing being bid on
  EXISTS (
    SELECT 1
    FROM public.listings
    WHERE listings.id = bids.listing_id
    AND listings.seller_id = auth.uid()
  )
);