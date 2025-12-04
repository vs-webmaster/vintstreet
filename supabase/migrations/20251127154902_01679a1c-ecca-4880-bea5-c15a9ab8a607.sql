-- Add image_url column to product_subcategories table
ALTER TABLE product_subcategories 
ADD COLUMN IF NOT EXISTS image_url TEXT;