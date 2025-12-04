-- Add stock_quantity column to listings table
ALTER TABLE public.listings
ADD COLUMN stock_quantity INTEGER DEFAULT NULL;

-- Add check constraint to ensure stock_quantity is non-negative
ALTER TABLE public.listings
ADD CONSTRAINT listings_stock_quantity_check CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

-- Add index for better query performance
CREATE INDEX idx_listings_stock_quantity ON public.listings(stock_quantity);

COMMENT ON COLUMN public.listings.stock_quantity IS 'Available quantity for multi-item products. NULL indicates single item product.';