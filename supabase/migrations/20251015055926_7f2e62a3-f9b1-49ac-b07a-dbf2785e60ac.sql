-- Add marketplace listing status column to listings table
ALTER TABLE public.listings
ADD COLUMN is_marketplace_listed boolean DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.listings.is_marketplace_listed IS 'Controls whether the product is visible on the marketplace. Requires shipping options to be set before going live.';