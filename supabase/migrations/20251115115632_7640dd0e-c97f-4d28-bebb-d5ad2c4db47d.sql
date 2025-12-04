-- Add admin policies for product_level2_categories
CREATE POLICY "Admins can insert any product level 2 categories"
  ON public.product_level2_categories
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can delete any product level 2 categories"
  ON public.product_level2_categories
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Add admin policies for product_level3_categories
CREATE POLICY "Admins can insert any product level 3 categories"
  ON public.product_level3_categories
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can delete any product level 3 categories"
  ON public.product_level3_categories
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
  );