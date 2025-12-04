-- Update existing products to be marketplace listed by default
UPDATE public.listings
SET is_marketplace_listed = true
WHERE product_type = 'shop' 
  AND is_active = true
  AND is_marketplace_listed = false;

-- Change the default value to true for new products
ALTER TABLE public.listings
ALTER COLUMN is_marketplace_listed SET DEFAULT true;