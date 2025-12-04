-- Create mega menu trending items table
CREATE TABLE IF NOT EXISTS public.mega_menu_trending_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  sub_sub_subcategory_id UUID NOT NULL REFERENCES public.product_sub_sub_subcategories(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(category_id, sub_sub_subcategory_id)
);

-- Create mega menu best sellers table
CREATE TABLE IF NOT EXISTS public.mega_menu_best_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  sub_sub_subcategory_id UUID NOT NULL REFERENCES public.product_sub_sub_subcategories(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(category_id, sub_sub_subcategory_id)
);

-- Create mega menu luxury brands table
CREATE TABLE IF NOT EXISTS public.mega_menu_luxury_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(category_id, brand_id)
);

-- RLS policies for trending items
ALTER TABLE public.mega_menu_trending_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trending items are viewable by everyone"
  ON public.mega_menu_trending_items
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage trending items"
  ON public.mega_menu_trending_items
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

-- RLS policies for best sellers
ALTER TABLE public.mega_menu_best_sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Best sellers are viewable by everyone"
  ON public.mega_menu_best_sellers
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage best sellers"
  ON public.mega_menu_best_sellers
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

-- RLS policies for luxury brands
ALTER TABLE public.mega_menu_luxury_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Luxury brands are viewable by everyone"
  ON public.mega_menu_luxury_brands
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage luxury brands"
  ON public.mega_menu_luxury_brands
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

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_mega_menu_trending_category ON public.mega_menu_trending_items(category_id);
CREATE INDEX IF NOT EXISTS idx_mega_menu_trending_display ON public.mega_menu_trending_items(display_order);
CREATE INDEX IF NOT EXISTS idx_mega_menu_best_sellers_category ON public.mega_menu_best_sellers(category_id);
CREATE INDEX IF NOT EXISTS idx_mega_menu_best_sellers_display ON public.mega_menu_best_sellers(display_order);
CREATE INDEX IF NOT EXISTS idx_mega_menu_luxury_brands_category ON public.mega_menu_luxury_brands(category_id);
CREATE INDEX IF NOT EXISTS idx_mega_menu_luxury_brands_display ON public.mega_menu_luxury_brands(display_order);