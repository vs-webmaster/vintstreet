-- Drop redundant mega menu featured items table
DROP TABLE IF EXISTS public.mega_menu_featured_items CASCADE;

-- Drop redundant product listings with seller view
DROP VIEW IF EXISTS public.product_listings_with_seller CASCADE;

-- Drop trigger that refreshes the sales status (if it exists)
DROP TRIGGER IF EXISTS trigger_refresh_sales_status ON public.orders;

-- Drop functions related to sales status refresh
DROP FUNCTION IF EXISTS public.trigger_refresh_sales_status() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_product_sales_status() CASCADE;

-- Drop redundant product sales status view (regular view, not materialized)
DROP VIEW IF EXISTS public.product_sales_status_view CASCADE;

COMMENT ON SCHEMA public IS 'Cleaned up redundant tables and views: mega_menu_featured_items, product_listings_with_seller, and product_sales_status_view';