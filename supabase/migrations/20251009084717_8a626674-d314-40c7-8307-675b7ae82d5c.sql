-- Drop existing policies for product_categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.product_categories;
DROP POLICY IF EXISTS "Super admins can manage categories" ON public.product_categories;

-- Recreate policies with proper WITH CHECK for inserts
CREATE POLICY "Categories are viewable by everyone" 
ON public.product_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can insert categories" 
ON public.product_categories 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update categories" 
ON public.product_categories 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete categories" 
ON public.product_categories 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Drop existing policies for product_subcategories
DROP POLICY IF EXISTS "Subcategories are viewable by everyone" ON public.product_subcategories;
DROP POLICY IF EXISTS "Super admins can manage subcategories" ON public.product_subcategories;

-- Recreate policies with proper WITH CHECK for inserts
CREATE POLICY "Subcategories are viewable by everyone" 
ON public.product_subcategories 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can insert subcategories" 
ON public.product_subcategories 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update subcategories" 
ON public.product_subcategories 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete subcategories" 
ON public.product_subcategories 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));