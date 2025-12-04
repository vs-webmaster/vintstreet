-- Create table to store which attributes should be shown as filters for each category level
CREATE TABLE IF NOT EXISTS public.category_attribute_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES public.product_subcategories(id) ON DELETE CASCADE,
  sub_subcategory_id UUID REFERENCES public.product_sub_subcategories(id) ON DELETE CASCADE,
  sub_sub_subcategory_id UUID REFERENCES public.product_sub_sub_subcategories(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id, attribute_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_attribute_filters_lookup 
ON public.category_attribute_filters(category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id, is_active);

CREATE INDEX IF NOT EXISTS idx_category_attribute_filters_attribute 
ON public.category_attribute_filters(attribute_id);

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER update_category_attribute_filters_updated_at
  BEFORE UPDATE ON public.category_attribute_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.category_attribute_filters ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read filter settings
CREATE POLICY "Anyone can read category attribute filters"
  ON public.category_attribute_filters
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Only admins can modify filter settings
CREATE POLICY "Only admins can modify category attribute filters"
  ON public.category_attribute_filters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );