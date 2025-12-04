-- Add show_in_mega_menu column to subcategories
ALTER TABLE product_subcategories
ADD COLUMN IF NOT EXISTS show_in_mega_menu boolean DEFAULT true;

-- Add show_in_mega_menu column to sub-subcategories
ALTER TABLE product_sub_subcategories
ADD COLUMN IF NOT EXISTS show_in_mega_menu boolean DEFAULT true;

-- Add show_in_mega_menu column to sub-sub-subcategories
ALTER TABLE product_sub_sub_subcategories
ADD COLUMN IF NOT EXISTS show_in_mega_menu boolean DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_subcategories_mega_menu 
ON product_subcategories(show_in_mega_menu, is_active);

CREATE INDEX IF NOT EXISTS idx_product_sub_subcategories_mega_menu 
ON product_sub_subcategories(show_in_mega_menu, is_active);

CREATE INDEX IF NOT EXISTS idx_product_sub_sub_subcategories_mega_menu 
ON product_sub_sub_subcategories(show_in_mega_menu, is_active);