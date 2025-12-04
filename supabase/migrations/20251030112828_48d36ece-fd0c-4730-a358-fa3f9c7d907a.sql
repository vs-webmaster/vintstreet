-- Enable RLS on the materialized view
ALTER MATERIALIZED VIEW public.product_sales_status OWNER TO postgres;

-- Note: Materialized views don't support RLS directly in PostgreSQL
-- Instead, we'll create a view wrapper with RLS
CREATE OR REPLACE VIEW public.product_sales_status_view 
WITH (security_invoker=true) AS
SELECT * FROM public.product_sales_status;

-- Enable RLS on the view wrapper
ALTER VIEW public.product_sales_status_view SET (security_invoker = on);

-- Grant appropriate permissions
GRANT SELECT ON public.product_sales_status TO authenticated;
GRANT SELECT ON public.product_sales_status_view TO authenticated;

COMMENT ON MATERIALIZED VIEW public.product_sales_status IS 
'Internal materialized view for product sales status. Use product_sales_status_view for API access.';