-- Create view for product listings with seller info to eliminate N+1 queries
CREATE OR REPLACE VIEW product_listings_with_seller AS
SELECT 
  l.*,
  s.shop_name,
  s.display_name_format,
  s.shop_logo_url,
  p.full_name,
  p.username,
  p.avatar_url
FROM listings l
LEFT JOIN seller_profiles s ON l.seller_id = s.user_id
LEFT JOIN profiles p ON l.seller_id = p.user_id
WHERE l.status = 'published';

-- Add indexes for critical queries
CREATE INDEX IF NOT EXISTS idx_listings_status_category_created 
  ON listings(status, category_id, created_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_shop_section_products_section_order 
  ON shop_section_products(shop_section_id, display_order);

CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute_product 
  ON product_attribute_values(attribute_id, product_id);

-- Add index for brand filtering
CREATE INDEX IF NOT EXISTS idx_listings_brand_status 
  ON listings(brand_id, status)
  WHERE status = 'published';