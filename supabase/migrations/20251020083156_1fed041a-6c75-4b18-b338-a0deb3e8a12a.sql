-- Add SEO meta fields to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text;

-- Add comments explaining the fields
COMMENT ON COLUMN public.listings.meta_title IS 'SEO meta title for the product page (recommended: 50-60 characters)';
COMMENT ON COLUMN public.listings.meta_description IS 'SEO meta description for the product page (recommended: 150-160 characters)';