-- Add DELETE policy for listings so sellers can delete their own products
CREATE POLICY "Sellers can delete their own listings"
ON public.listings
FOR DELETE
USING (auth.uid() = seller_id);