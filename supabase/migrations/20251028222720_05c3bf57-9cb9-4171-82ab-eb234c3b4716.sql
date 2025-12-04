-- Fix subcategory slug uniqueness to be per category instead of global
-- Drop the existing unique constraint on slug
ALTER TABLE product_subcategories DROP CONSTRAINT IF EXISTS product_subcategories_slug_key;

-- Add a unique constraint on category_id + slug combination
-- This allows the same slug to exist under different categories
ALTER TABLE product_subcategories ADD CONSTRAINT product_subcategories_category_slug_key UNIQUE (category_id, slug);