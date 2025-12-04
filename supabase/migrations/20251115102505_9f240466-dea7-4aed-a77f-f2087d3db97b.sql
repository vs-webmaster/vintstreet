-- Create table for additional Level 2 categories (subcategories)
CREATE TABLE IF NOT EXISTS public.product_level2_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.product_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, subcategory_id)
);

-- Create table for additional Level 3 categories (sub_subcategories)
CREATE TABLE IF NOT EXISTS public.product_level3_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sub_subcategory_id UUID NOT NULL REFERENCES public.product_sub_subcategories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, sub_subcategory_id)
);

-- Enable Row Level Security
ALTER TABLE public.product_level2_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_level3_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for product_level2_categories
CREATE POLICY "Anyone can view level 2 categories"
  ON public.product_level2_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own product level 2 categories"
  ON public.product_level2_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = product_id
      AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own product level 2 categories"
  ON public.product_level2_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = product_id
      AND listings.seller_id = auth.uid()
    )
  );

-- Create policies for product_level3_categories
CREATE POLICY "Anyone can view level 3 categories"
  ON public.product_level3_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own product level 3 categories"
  ON public.product_level3_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = product_id
      AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own product level 3 categories"
  ON public.product_level3_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.id = product_id
      AND listings.seller_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_level2_categories_product_id 
  ON public.product_level2_categories(product_id);
  
CREATE INDEX IF NOT EXISTS idx_product_level2_categories_subcategory_id 
  ON public.product_level2_categories(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_product_level3_categories_product_id 
  ON public.product_level3_categories(product_id);
  
CREATE INDEX IF NOT EXISTS idx_product_level3_categories_sub_subcategory_id 
  ON public.product_level3_categories(sub_subcategory_id);