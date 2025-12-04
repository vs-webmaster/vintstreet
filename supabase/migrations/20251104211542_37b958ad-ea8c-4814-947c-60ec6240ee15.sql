-- Add image upload field to shop_sections (will store storage path)
ALTER TABLE public.shop_sections 
ADD COLUMN image_path TEXT;

-- Create junction table for shop section products
CREATE TABLE public.shop_section_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_section_id UUID NOT NULL REFERENCES public.shop_sections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_section_id, product_id)
);

-- Enable RLS
ALTER TABLE public.shop_section_products ENABLE ROW LEVEL SECURITY;

-- Everyone can view section products
CREATE POLICY "Shop section products are viewable by everyone"
ON public.shop_section_products
FOR SELECT
USING (true);

-- Admins can manage section products
CREATE POLICY "Admins can manage shop section products"
ON public.shop_section_products
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);