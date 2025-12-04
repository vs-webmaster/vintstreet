-- Add show_in_mega_menu field to product_categories to control visibility in mega menu
ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS show_in_mega_menu BOOLEAN DEFAULT true;

-- Update existing categories to be visible by default
UPDATE product_categories 
SET show_in_mega_menu = true 
WHERE show_in_mega_menu IS NULL;