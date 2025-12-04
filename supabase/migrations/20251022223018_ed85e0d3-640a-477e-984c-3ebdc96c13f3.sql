-- Create product_tags table to store tags
CREATE TABLE public.product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for many-to-many relationship between products and tags
CREATE TABLE public.product_tag_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.product_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

-- Enable RLS on product_tags
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_tag_links
ALTER TABLE public.product_tag_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_tags
CREATE POLICY "Product tags are viewable by everyone"
  ON public.product_tags FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage product tags"
  ON public.product_tags FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for product_tag_links
CREATE POLICY "Product tag links are viewable by everyone"
  ON public.product_tag_links FOR SELECT
  USING (true);

CREATE POLICY "Sellers can manage their product tags"
  ON public.product_tag_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = product_tag_links.product_id
      AND listings.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = product_tag_links.product_id
      AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all product tag links"
  ON public.product_tag_links FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_product_tags_slug ON public.product_tags(slug);
CREATE INDEX idx_product_tags_featured_category ON public.product_tags(is_featured, category_id) WHERE is_featured = true;
CREATE INDEX idx_product_tag_links_product_id ON public.product_tag_links(product_id);
CREATE INDEX idx_product_tag_links_tag_id ON public.product_tag_links(tag_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_product_tags_updated_at
  BEFORE UPDATE ON public.product_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();