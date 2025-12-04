-- Add slug column to product_sub_subcategories table
ALTER TABLE product_sub_subcategories 
ADD COLUMN slug text;

-- Generate slugs from names (lowercase, replace spaces with hyphens)
UPDATE product_sub_subcategories 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL and add unique constraint
ALTER TABLE product_sub_subcategories 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint on slug per subcategory
CREATE UNIQUE INDEX product_sub_subcategories_subcategory_slug_idx 
ON product_sub_subcategories(subcategory_id, slug);