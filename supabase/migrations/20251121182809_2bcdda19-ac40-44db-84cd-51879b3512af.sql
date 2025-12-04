-- Create app content tables

-- Carousel items
CREATE TABLE IF NOT EXISTS public.app_content_carousel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  text TEXT NOT NULL,
  link TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grid section (single row for title)
CREATE TABLE IF NOT EXISTS public.app_content_grid (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grid images (max 4)
CREATE TABLE IF NOT EXISTS public.app_content_grid_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brands section (single row for brands list)
CREATE TABLE IF NOT EXISTS public.app_content_brands (
  id TEXT PRIMARY KEY DEFAULT 'default',
  brands_list TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Featured section (single row for title)
CREATE TABLE IF NOT EXISTS public.app_content_featured (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Featured images (max 8)
CREATE TABLE IF NOT EXISTS public.app_content_featured_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_content_carousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_content_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_content_grid_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_content_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_content_featured ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_content_featured_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can manage, everyone can view
CREATE POLICY "Admins can manage carousel"
  ON public.app_content_carousel
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view carousel"
  ON public.app_content_carousel
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage grid"
  ON public.app_content_grid
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view grid"
  ON public.app_content_grid
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage grid images"
  ON public.app_content_grid_images
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view grid images"
  ON public.app_content_grid_images
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage brands"
  ON public.app_content_brands
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view brands"
  ON public.app_content_brands
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage featured"
  ON public.app_content_featured
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view featured"
  ON public.app_content_featured
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage featured images"
  ON public.app_content_featured_images
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view featured images"
  ON public.app_content_featured_images
  FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_app_carousel_order ON public.app_content_carousel(display_order);
CREATE INDEX idx_app_grid_images_order ON public.app_content_grid_images(display_order);
CREATE INDEX idx_app_featured_images_order ON public.app_content_featured_images(display_order);