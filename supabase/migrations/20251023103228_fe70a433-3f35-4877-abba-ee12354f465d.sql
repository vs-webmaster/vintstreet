-- Add product_image_alts column to listings table
ALTER TABLE public.listings 
ADD COLUMN product_image_alts JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.listings.product_image_alts IS 'Array of alt tags corresponding to each image in product_images array';