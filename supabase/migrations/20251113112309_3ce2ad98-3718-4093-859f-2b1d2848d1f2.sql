-- Create table for category filter settings
CREATE TABLE IF NOT EXISTS public.category_filter_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES public.product_subcategories(id) ON DELETE CASCADE,
  sub_subcategory_id UUID REFERENCES public.product_sub_subcategories(id) ON DELETE CASCADE,
  sub_sub_subcategory_id UUID REFERENCES public.product_sub_sub_subcategories(id) ON DELETE CASCADE,
  show_brand_filter BOOLEAN DEFAULT true,
  show_size_filter BOOLEAN DEFAULT true,
  show_color_filter BOOLEAN DEFAULT true,
  show_price_filter BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure only one configuration per category combination
  CONSTRAINT unique_category_combination UNIQUE NULLS NOT DISTINCT (category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id),
  
  -- Ensure at least one category level is specified
  CONSTRAINT at_least_one_category CHECK (
    category_id IS NOT NULL OR 
    subcategory_id IS NOT NULL OR 
    sub_subcategory_id IS NOT NULL OR 
    sub_sub_subcategory_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE public.category_filter_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view filter settings
CREATE POLICY "Anyone can view filter settings"
ON public.category_filter_settings
FOR SELECT
TO public
USING (true);

-- Allow admins to manage filter settings
CREATE POLICY "Admins can manage filter settings"
ON public.category_filter_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])
  )
);

-- Create index for faster lookups
CREATE INDEX idx_category_filter_settings_category_ids 
ON public.category_filter_settings (category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id);