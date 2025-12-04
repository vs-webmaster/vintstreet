-- Update listings UPDATE policy to allow admins
DROP POLICY IF EXISTS "Sellers can update their own listings" ON public.listings;
CREATE POLICY "Sellers and admins can update listings" ON public.listings
  FOR UPDATE
  USING (
    auth.uid() = seller_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Update listings DELETE policy to allow admins
DROP POLICY IF EXISTS "Sellers can delete their own listings" ON public.listings;
CREATE POLICY "Sellers and admins can delete listings" ON public.listings
  FOR DELETE
  USING (
    auth.uid() = seller_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Update product_attribute_values ALL policy to allow admins
DROP POLICY IF EXISTS "Sellers can manage their product attributes" ON public.product_attribute_values;
CREATE POLICY "Sellers and admins can manage product attributes" ON public.product_attribute_values
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE listings.id = product_attribute_values.product_id 
      AND listings.seller_id = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE listings.id = product_attribute_values.product_id 
      AND listings.seller_id = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );