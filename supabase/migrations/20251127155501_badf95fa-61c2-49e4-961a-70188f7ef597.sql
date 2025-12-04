-- Add image_url column to product_sub_subcategories table
ALTER TABLE product_sub_subcategories 
ADD COLUMN IF NOT EXISTS image_url TEXT;