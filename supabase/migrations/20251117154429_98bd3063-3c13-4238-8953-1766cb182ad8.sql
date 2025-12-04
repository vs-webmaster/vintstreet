-- Add indexes for frequently filtered columns to improve query performance

-- Main listings table indexes for common filters
CREATE INDEX IF NOT EXISTS idx_listings_seller_archived_status 
ON listings(seller_id, archived, status) WHERE product_type = 'shop';

CREATE INDEX IF NOT EXISTS idx_listings_brand_category 
ON listings(brand_id, category_id, subcategory_id);

CREATE INDEX IF NOT EXISTS idx_listings_updated_at 
ON listings(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_search 
ON listings USING gin(to_tsvector('english', product_name));

-- Product attribute values for color filtering
CREATE INDEX IF NOT EXISTS idx_product_attributes_colour 
ON product_attribute_values(attribute_id, product_id) 
WHERE value_text IS NOT NULL;

-- Junction table for Level 4 categories
CREATE INDEX IF NOT EXISTS idx_product_level4_product_category 
ON product_level4_categories(product_id, sub_sub_subcategory_id);

-- Orders table for sold status filtering
CREATE INDEX IF NOT EXISTS idx_orders_listing_id 
ON orders(listing_id);
