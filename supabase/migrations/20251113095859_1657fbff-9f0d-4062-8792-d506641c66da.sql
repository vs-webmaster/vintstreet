-- Create table for no products found settings
CREATE TABLE IF NOT EXISTS public.no_products_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT,
  cta_text TEXT DEFAULT 'Become a Seller',
  cta_link TEXT DEFAULT '/become-seller',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.no_products_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read
CREATE POLICY "Anyone can view no products settings"
  ON public.no_products_settings
  FOR SELECT
  USING (true);

-- Only admins can manage
CREATE POLICY "Only admins can manage no products settings"
  ON public.no_products_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default row
INSERT INTO public.no_products_settings (id, image_url, cta_text, cta_link)
VALUES ('00000000-0000-0000-0000-000000000001', null, 'Become a Seller', '/become-seller')
ON CONFLICT (id) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_no_products_settings_updated_at
  BEFORE UPDATE ON public.no_products_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();