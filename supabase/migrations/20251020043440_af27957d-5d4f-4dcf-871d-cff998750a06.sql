-- Add product inventory and dimension fields to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS length numeric,
ADD COLUMN IF NOT EXISTS width numeric,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS stock_id text;

-- Create index on SKU for faster lookups
CREATE INDEX IF NOT EXISTS idx_listings_sku ON public.listings(sku);

-- Create index on stock_id for inventory tracking
CREATE INDEX IF NOT EXISTS idx_listings_stock_id ON public.listings(stock_id);

-- Add comments explaining the fields
COMMENT ON COLUMN public.listings.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN public.listings.weight IS 'Product weight (in grams or preferred unit)';
COMMENT ON COLUMN public.listings.length IS 'Product length dimension';
COMMENT ON COLUMN public.listings.width IS 'Product width dimension';
COMMENT ON COLUMN public.listings.height IS 'Product height dimension';
COMMENT ON COLUMN public.listings.stock_id IS 'Internal stock/inventory tracking identifier';