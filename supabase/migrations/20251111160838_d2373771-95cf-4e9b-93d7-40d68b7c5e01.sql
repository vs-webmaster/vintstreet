-- Add category support to mega menu custom list items
ALTER TABLE mega_menu_custom_list_items
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES master_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_level integer CHECK (category_level IN (3, 4));

-- Make url nullable since we can now use category_id instead
ALTER TABLE mega_menu_custom_list_items
ALTER COLUMN url DROP NOT NULL;

-- Add check constraint to ensure either url or category_id is provided
ALTER TABLE mega_menu_custom_list_items
ADD CONSTRAINT url_or_category_required CHECK (
  (url IS NOT NULL AND category_id IS NULL) OR
  (url IS NULL AND category_id IS NOT NULL)
);