-- Drop the incorrect foreign key constraint
ALTER TABLE mega_menu_custom_list_items
DROP CONSTRAINT IF EXISTS mega_menu_custom_list_items_category_id_fkey;

-- The category_id can reference any of the 4 category tables, so we don't add a foreign key
-- Instead we'll handle validation in the application layer
COMMENT ON COLUMN mega_menu_custom_list_items.category_id IS 'Can reference product_categories (L1), product_subcategories (L2), product_sub_subcategories (L3), or product_sub_sub_subcategories (L4) based on category_level';