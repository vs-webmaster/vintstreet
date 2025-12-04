-- Create table for shop page hero grid images
CREATE TABLE IF NOT EXISTS public.shop_hero_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  button_text TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shop_hero_images_display_order_check CHECK (display_order >= 1 AND display_order <= 5)
);

-- Enable RLS
ALTER TABLE public.shop_hero_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Shop hero images are viewable by everyone"
  ON public.shop_hero_images
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage
CREATE POLICY "Authenticated users can insert shop hero images"
  ON public.shop_hero_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shop hero images"
  ON public.shop_hero_images
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete shop hero images"
  ON public.shop_hero_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_shop_hero_images_updated_at
  BEFORE UPDATE ON public.shop_hero_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();