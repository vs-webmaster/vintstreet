-- Create shop brand section table
CREATE TABLE public.shop_brand_section (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  brand_link TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_brand_section ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Brand items are viewable by everyone"
ON public.shop_brand_section
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage brand items"
ON public.shop_brand_section
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_shop_brand_section_updated_at
BEFORE UPDATE ON public.shop_brand_section
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();