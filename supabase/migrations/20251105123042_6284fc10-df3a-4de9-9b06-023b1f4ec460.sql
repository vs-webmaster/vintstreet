-- Add page_type column to content_pages
ALTER TABLE public.content_pages 
ADD COLUMN page_type text NOT NULL DEFAULT 'content';

-- Add check constraint for page_type
ALTER TABLE public.content_pages
ADD CONSTRAINT content_pages_page_type_check 
CHECK (page_type IN ('content', 'product'));

-- Create content_page_products table
CREATE TABLE public.content_page_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page_id, product_id)
);

-- Add RLS policies for content_page_products
ALTER TABLE public.content_page_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content page products are viewable by everyone"
ON public.content_page_products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage content page products"
ON public.content_page_products FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for better query performance
CREATE INDEX idx_content_page_products_page_id ON public.content_page_products(page_id);
CREATE INDEX idx_content_page_products_display_order ON public.content_page_products(page_id, display_order);