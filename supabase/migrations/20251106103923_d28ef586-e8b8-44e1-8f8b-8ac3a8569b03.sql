-- Add synonyms column to all 4 category levels for smart search
ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS synonyms text[];

ALTER TABLE product_subcategories 
ADD COLUMN IF NOT EXISTS synonyms text[];

ALTER TABLE product_sub_subcategories 
ADD COLUMN IF NOT EXISTS synonyms text[];

ALTER TABLE product_sub_sub_subcategories 
ADD COLUMN IF NOT EXISTS synonyms text[];