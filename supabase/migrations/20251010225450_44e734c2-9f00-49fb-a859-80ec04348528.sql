-- Add slug fields to categories and subcategories for SEO-friendly URLs
ALTER TABLE public.product_categories ADD COLUMN slug text UNIQUE;
ALTER TABLE public.product_subcategories ADD COLUMN slug text UNIQUE;

-- Generate slugs from existing names (lowercase, spaces to dashes)
UPDATE public.product_categories 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));

UPDATE public.product_subcategories 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));

-- Make slug required going forward
ALTER TABLE public.product_categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.product_subcategories ALTER COLUMN slug SET NOT NULL;