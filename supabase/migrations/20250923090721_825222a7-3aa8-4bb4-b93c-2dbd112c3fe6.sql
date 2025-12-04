-- Add product_type column to listings table
ALTER TABLE public.listings ADD COLUMN product_type text NOT NULL DEFAULT 'livestream';

-- Add check constraint for product_type
ALTER TABLE public.listings ADD CONSTRAINT listings_product_type_check 
CHECK (product_type IN ('livestream', 'shop'));

-- Update existing records to be livestream products
UPDATE public.listings SET product_type = 'livestream' WHERE product_type IS NULL;