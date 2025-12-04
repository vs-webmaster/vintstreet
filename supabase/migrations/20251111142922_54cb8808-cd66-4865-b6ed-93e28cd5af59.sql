-- Fix mega_menu_custom_lists to be category-agnostic
-- Drop the category_id column since lists are assigned to categories in the layout

ALTER TABLE mega_menu_custom_lists
  DROP COLUMN category_id;

-- The assignment of custom lists to categories happens in mega_menu_layouts.columns jsonb