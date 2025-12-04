-- Create table for linking attributes to Level 1 categories
CREATE TABLE IF NOT EXISTS public.attribute_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attribute_id UUID NOT NULL REFERENCES public.global_attributes(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, category_id)
);

-- Enable RLS
ALTER TABLE public.attribute_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing attribute-category links
CREATE POLICY "Anyone can view attribute-category links"
  ON public.attribute_categories
  FOR SELECT
  USING (true);

-- Create policy for inserting attribute-category links (admin only)
CREATE POLICY "Admins can insert attribute-category links"
  ON public.attribute_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Create policy for deleting attribute-category links (admin only)
CREATE POLICY "Admins can delete attribute-category links"
  ON public.attribute_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_attribute_categories_attribute_id 
  ON public.attribute_categories(attribute_id);
  
CREATE INDEX IF NOT EXISTS idx_attribute_categories_category_id 
  ON public.attribute_categories(category_id);