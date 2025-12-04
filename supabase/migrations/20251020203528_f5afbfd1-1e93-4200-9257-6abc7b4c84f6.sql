-- Update incorrect subcategory slugs to match their names
UPDATE product_subcategories 
SET slug = 'accessories', updated_at = now()
WHERE name = 'Accessories' AND slug = 'jackets-coats';

UPDATE product_subcategories 
SET slug = 'clothing', updated_at = now()
WHERE name = 'Clothing' AND slug = 'jeans';