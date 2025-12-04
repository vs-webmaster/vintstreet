-- Fix security issues identified in security scan

-- 1. Remove overly permissive "Access" policy on messages table
-- This policy allows ALL operations with no restrictions, bypassing all other policies
DROP POLICY IF EXISTS "Access" ON public.messages;

-- 2. Remove overly permissive "Access" policy on reviews table
-- This policy allows ALL operations with no restrictions, bypassing all other policies
DROP POLICY IF EXISTS "Access" ON public.reviews;

-- 3. Hide materialized view from API to prevent unauthorized data access
-- Revoke public access to product_sales_status materialized view
REVOKE ALL ON public.product_sales_status FROM anon, authenticated;

-- Grant specific SELECT access only to authenticated users for the materialized view
GRANT SELECT ON public.product_sales_status TO authenticated;

-- 4. Verify RLS is enabled on critical tables (should already be enabled)
-- These commands are idempotent and safe to run
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Note: Leaked password protection must be enabled manually in Supabase Dashboard:
-- Go to Authentication > Password Settings > Enable "Leaked Password Protection"