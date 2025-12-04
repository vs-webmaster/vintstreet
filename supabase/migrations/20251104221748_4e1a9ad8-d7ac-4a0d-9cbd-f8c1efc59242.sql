-- Add performance indexes for shop page queries

-- Index for listings status and created_at (used in product queries)
CREATE INDEX IF NOT EXISTS idx_listings_status_created 
ON public.listings(status, created_at DESC);

-- Index for listings category filtering
CREATE INDEX IF NOT EXISTS idx_listings_category 
ON public.listings(category_id) WHERE status = 'published';

-- Index for listings subcategory filtering
CREATE INDEX IF NOT EXISTS idx_listings_subcategory 
ON public.listings(subcategory_id) WHERE status = 'published';

-- Index for listings sub_subcategory filtering
CREATE INDEX IF NOT EXISTS idx_listings_sub_subcategory 
ON public.listings(sub_subcategory_id) WHERE status = 'published';

-- Index for listings sub_sub_subcategory (level 4) filtering
CREATE INDEX IF NOT EXISTS idx_listings_level4 
ON public.listings(sub_sub_subcategory_id) WHERE status = 'published';

-- Index for brand filtering
CREATE INDEX IF NOT EXISTS idx_listings_brand 
ON public.listings(brand_id) WHERE status = 'published';

-- Composite index for webp images on main shop page
CREATE INDEX IF NOT EXISTS idx_listings_webp_status 
ON public.listings(is_webp_main_image, status, created_at DESC) 
WHERE is_webp_main_image = true AND status = 'published';

-- Index for product attribute values queries
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_lookup 
ON public.product_attribute_values(attribute_id, product_id);

-- Index for wishlist queries
CREATE INDEX IF NOT EXISTS idx_wishlist_user_listing 
ON public.wishlist(user_id, listing_id);

-- Index for product tag links
CREATE INDEX IF NOT EXISTS idx_product_tag_links_tag 
ON public.product_tag_links(tag_id, product_id);

-- Index for product level 4 categories
CREATE INDEX IF NOT EXISTS idx_product_level4_categories_product 
ON public.product_level4_categories(product_id, sub_sub_subcategory_id);