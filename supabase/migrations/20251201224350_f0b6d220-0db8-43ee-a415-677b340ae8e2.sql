-- Phase 1: Create normalized CMS tables

-- 1.1 Homepage Cards (replaces shop features in site_content)
CREATE TABLE IF NOT EXISTS public.homepage_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.homepage_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_card_id UUID REFERENCES public.homepage_cards(id) ON DELETE CASCADE,
  image_url TEXT,
  link TEXT,
  overlay_text TEXT,
  button_text TEXT,
  button_link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Instagram Posts
CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_code TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Shop Video Config (normalized from shop_video_section)
CREATE TABLE IF NOT EXISTS public.shop_video_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  video_url TEXT,
  phone_mockup_url TEXT,
  cta_text TEXT,
  cta_link TEXT,
  cta_bg_color TEXT DEFAULT '#000000',
  cta_text_color TEXT DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_video_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.shop_video_config(id) ON DELETE CASCADE,
  image_url TEXT,
  text TEXT,
  link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_card_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_video_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_video_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "Anyone can view homepage cards" ON public.homepage_cards;
CREATE POLICY "Anyone can view homepage cards" ON public.homepage_cards FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage homepage cards" ON public.homepage_cards;
CREATE POLICY "Admins can manage homepage cards" ON public.homepage_cards FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view homepage card items" ON public.homepage_card_items;
CREATE POLICY "Anyone can view homepage card items" ON public.homepage_card_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage homepage card items" ON public.homepage_card_items;
CREATE POLICY "Admins can manage homepage card items" ON public.homepage_card_items FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view instagram posts" ON public.instagram_posts;
CREATE POLICY "Anyone can view instagram posts" ON public.instagram_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage instagram posts" ON public.instagram_posts;
CREATE POLICY "Admins can manage instagram posts" ON public.instagram_posts FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view shop video config" ON public.shop_video_config;
CREATE POLICY "Anyone can view shop video config" ON public.shop_video_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage shop video config" ON public.shop_video_config;
CREATE POLICY "Admins can manage shop video config" ON public.shop_video_config FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view shop video features" ON public.shop_video_features;
CREATE POLICY "Anyone can view shop video features" ON public.shop_video_features FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage shop video features" ON public.shop_video_features;
CREATE POLICY "Admins can manage shop video features" ON public.shop_video_features FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_homepage_card_items_card_id ON public.homepage_card_items(homepage_card_id);
CREATE INDEX IF NOT EXISTS idx_homepage_card_items_order ON public.homepage_card_items(display_order);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_order ON public.instagram_posts(display_order);
CREATE INDEX IF NOT EXISTS idx_shop_video_features_config_id ON public.shop_video_features(config_id);
CREATE INDEX IF NOT EXISTS idx_shop_video_features_order ON public.shop_video_features(display_order);