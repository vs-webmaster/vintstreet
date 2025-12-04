-- Create shop sections table
CREATE TABLE public.shop_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_sections ENABLE ROW LEVEL SECURITY;

-- Everyone can view active sections
CREATE POLICY "Shop sections are viewable by everyone"
ON public.shop_sections
FOR SELECT
USING (is_active = true);

-- Admins can manage sections
CREATE POLICY "Admins can manage shop sections"
ON public.shop_sections
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create updated_at trigger
CREATE TRIGGER update_shop_sections_updated_at
BEFORE UPDATE ON public.shop_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();