-- Create table to link brands to categories for mega menu display
CREATE TABLE IF NOT EXISTS public.mega_menu_category_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, brand_id)
);

-- Enable RLS
ALTER TABLE public.mega_menu_category_brands ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active mega menu brands
CREATE POLICY "Mega menu brands are viewable by everyone"
  ON public.mega_menu_category_brands
  FOR SELECT
  USING (is_active = true);

-- Allow admins to manage mega menu brands
CREATE POLICY "Admins can manage mega menu brands"
  ON public.mega_menu_category_brands
  FOR ALL
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

-- Create index for better query performance
CREATE INDEX idx_mega_menu_category_brands_category ON public.mega_menu_category_brands(category_id);
CREATE INDEX idx_mega_menu_category_brands_brand ON public.mega_menu_category_brands(brand_id);

-- Add trigger for updated_at
CREATE TRIGGER update_mega_menu_category_brands_updated_at
  BEFORE UPDATE ON public.mega_menu_category_brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();