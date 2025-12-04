-- Fix Women's > Accessories subcategory slug
UPDATE product_subcategories 
SET slug = 'accessories', 
    updated_at = now()
WHERE id = '712022cf-3b75-4f03-b253-b841c63d561a';