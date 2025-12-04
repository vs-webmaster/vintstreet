-- Add policy to allow public viewing of seller profiles
CREATE POLICY "Anyone can view seller profiles"
ON public.seller_profiles
FOR SELECT
USING (true);