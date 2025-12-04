-- Add policy to allow buyers to cancel (delete) their own offers
CREATE POLICY "Buyers can delete their own offers"
ON public.offers
FOR DELETE
USING (auth.uid() = buyer_id);