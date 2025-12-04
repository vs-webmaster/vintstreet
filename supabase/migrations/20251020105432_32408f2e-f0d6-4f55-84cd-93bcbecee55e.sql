-- Create table to link attributes to level 3 categories (sub-subcategories)
CREATE TABLE IF NOT EXISTS public.attribute_sub_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attribute_id uuid NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  sub_subcategory_id uuid NOT NULL REFERENCES public.product_sub_subcategories(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, sub_subcategory_id)
);

-- Enable RLS
ALTER TABLE public.attribute_sub_subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Attribute sub-subcategories are viewable by everyone"
ON public.attribute_sub_subcategories
FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage attribute sub-subcategories"
ON public.attribute_sub_subcategories
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_attribute_sub_subcategories_attribute_id 
ON public.attribute_sub_subcategories(attribute_id);

CREATE INDEX IF NOT EXISTS idx_attribute_sub_subcategories_sub_subcategory_id 
ON public.attribute_sub_subcategories(sub_subcategory_id);