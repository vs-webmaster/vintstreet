-- Add slug column to listings table for SEO-friendly URLs
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);

-- Add comment explaining slug usage
COMMENT ON COLUMN public.listings.slug IS 'SEO-friendly URL slug. If null, the product ID will be used for URLs.';