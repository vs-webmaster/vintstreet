-- Add support for multiple category levels in mega menu trending items
ALTER TABLE mega_menu_trending_items 
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES product_subcategories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sub_subcategory_id uuid REFERENCES product_sub_subcategories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS item_level integer NOT NULL DEFAULT 4,
  ALTER COLUMN sub_sub_subcategory_id DROP NOT NULL;

-- Add comment to clarify usage
COMMENT ON COLUMN mega_menu_trending_items.item_level IS 'Category level: 2 (subcategory), 3 (sub_subcategory), or 4 (sub_sub_subcategory)';

-- Add check constraint to ensure only one category level is set
ALTER TABLE mega_menu_trending_items
  ADD CONSTRAINT trending_items_single_level_check CHECK (
    (item_level = 2 AND subcategory_id IS NOT NULL AND sub_subcategory_id IS NULL AND sub_sub_subcategory_id IS NULL) OR
    (item_level = 3 AND subcategory_id IS NULL AND sub_subcategory_id IS NOT NULL AND sub_sub_subcategory_id IS NULL) OR
    (item_level = 4 AND subcategory_id IS NULL AND sub_subcategory_id IS NULL AND sub_sub_subcategory_id IS NOT NULL)
  );

-- Add the same support for best sellers
ALTER TABLE mega_menu_best_sellers
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES product_subcategories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sub_subcategory_id uuid REFERENCES product_sub_subcategories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS item_level integer NOT NULL DEFAULT 4,
  ALTER COLUMN sub_sub_subcategory_id DROP NOT NULL;

COMMENT ON COLUMN mega_menu_best_sellers.item_level IS 'Category level: 2 (subcategory), 3 (sub_subcategory), or 4 (sub_sub_subcategory)';

ALTER TABLE mega_menu_best_sellers
  ADD CONSTRAINT best_sellers_single_level_check CHECK (
    (item_level = 2 AND subcategory_id IS NOT NULL AND sub_subcategory_id IS NULL AND sub_sub_subcategory_id IS NULL) OR
    (item_level = 3 AND subcategory_id IS NULL AND sub_subcategory_id IS NOT NULL AND sub_sub_subcategory_id IS NULL) OR
    (item_level = 4 AND subcategory_id IS NULL AND sub_subcategory_id IS NULL AND sub_sub_subcategory_id IS NOT NULL)
  );