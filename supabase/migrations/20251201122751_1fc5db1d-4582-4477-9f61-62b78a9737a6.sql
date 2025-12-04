-- Add field to control whether main category links are clickable in mega menu
ALTER TABLE product_categories 
ADD COLUMN disable_main_link boolean DEFAULT false;

COMMENT ON COLUMN product_categories.disable_main_link IS 'When true, category name in mega menu triggers dropdown but is not clickable as a link';