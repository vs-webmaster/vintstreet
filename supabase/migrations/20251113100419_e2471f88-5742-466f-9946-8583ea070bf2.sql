-- Add title and content fields to no_products_settings
ALTER TABLE public.no_products_settings
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'No Products Found',
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT 'We currently don''t have any products in this category. Check back soon or explore other categories!';

-- Update existing row with default values if they don't exist
UPDATE public.no_products_settings
SET 
  title = COALESCE(title, 'No Products Found'),
  content = COALESCE(content, 'We currently don''t have any products in this category. Check back soon or explore other categories!')
WHERE id = '00000000-0000-0000-0000-000000000001';