-- Drop the old constraint that only allows levels 3 and 4
ALTER TABLE mega_menu_custom_list_items 
DROP CONSTRAINT IF EXISTS mega_menu_custom_list_items_category_level_check;

-- Add new constraint that allows levels 1-4
ALTER TABLE mega_menu_custom_list_items 
ADD CONSTRAINT mega_menu_custom_list_items_category_level_check 
CHECK (category_level = ANY (ARRAY[1, 2, 3, 4]));