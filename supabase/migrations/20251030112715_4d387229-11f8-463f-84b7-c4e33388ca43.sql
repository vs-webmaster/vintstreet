-- Add indexes for faster queries on listings table
CREATE INDEX IF NOT EXISTS idx_listings_seller_type_archived 
ON public.listings(seller_id, product_type, archived, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_sub_subcategory 
ON public.listings(sub_subcategory_id) 
WHERE sub_subcategory_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_sub_sub_subcategory 
ON public.listings(sub_sub_subcategory_id) 
WHERE sub_sub_subcategory_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_brand 
ON public.listings(brand_id) 
WHERE brand_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_category 
ON public.listings(category_id) 
WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_subcategory 
ON public.listings(subcategory_id) 
WHERE subcategory_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_updated_at 
ON public.listings(updated_at DESC);

-- Add index for product attribute values
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product 
ON public.product_attribute_values(product_id, attribute_id);

-- Create materialized view for product sales status
CREATE MATERIALIZED VIEW IF NOT EXISTS public.product_sales_status AS
SELECT DISTINCT
  l.id as product_id,
  l.seller_id,
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.listing_id = l.id
  ) as has_sales
FROM public.listings l
WHERE l.product_type = 'shop';

-- Create unique index on materialized view for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_sales_status_product_id 
ON public.product_sales_status(product_id);

-- Create index on seller_id for filtering
CREATE INDEX IF NOT EXISTS idx_product_sales_status_seller 
ON public.product_sales_status(seller_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_product_sales_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_sales_status;
END;
$$;

-- Trigger to refresh view when orders are created/updated
CREATE OR REPLACE FUNCTION public.trigger_refresh_sales_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh the materialized view in the background
  PERFORM public.refresh_product_sales_status();
  RETURN NEW;
END;
$$;

-- Create triggers on orders table
DROP TRIGGER IF EXISTS refresh_sales_status_on_order_insert ON public.orders;
CREATE TRIGGER refresh_sales_status_on_order_insert
AFTER INSERT ON public.orders
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_sales_status();

DROP TRIGGER IF EXISTS refresh_sales_status_on_order_update ON public.orders;
CREATE TRIGGER refresh_sales_status_on_order_update
AFTER UPDATE ON public.orders
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_sales_status();

-- Initial refresh of the view
REFRESH MATERIALIZED VIEW public.product_sales_status;