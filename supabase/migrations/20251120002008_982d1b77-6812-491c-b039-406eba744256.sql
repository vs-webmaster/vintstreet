-- Allow admins and super_admins to fully manage product attribute values and product tags

-- Drop existing policies first
DROP POLICY IF EXISTS "Admins manage all product attributes" ON public.product_attribute_values;
DROP POLICY IF EXISTS "Admins manage all product tags" ON public.product_tag_links;

-- Product attribute values: grant admins and super_admins full CRUD
CREATE POLICY "Admins manage all product attributes"
ON public.product_attribute_values
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Product tag links: grant admins and super_admins full CRUD
CREATE POLICY "Admins manage all product tags"
ON public.product_tag_links
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);