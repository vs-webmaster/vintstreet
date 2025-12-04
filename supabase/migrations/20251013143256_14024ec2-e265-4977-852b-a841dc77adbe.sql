-- Add sub_subcategory_id column to listings table
ALTER TABLE public.listings
ADD COLUMN sub_subcategory_id uuid REFERENCES public.product_sub_subcategories(id) ON DELETE SET NULL;