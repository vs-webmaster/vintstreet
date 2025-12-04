-- Add display_order column to product_categories
ALTER TABLE public.product_categories
ADD COLUMN display_order integer;

-- Set default order based on creation order
UPDATE public.product_categories
SET display_order = row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM public.product_categories
) as numbered
WHERE product_categories.id = numbered.id;

-- Make display_order NOT NULL after setting defaults
ALTER TABLE public.product_categories
ALTER COLUMN display_order SET NOT NULL;

-- Add constraint to ensure unique ordering
ALTER TABLE public.product_categories
ADD CONSTRAINT unique_category_display_order UNIQUE (display_order);

-- Create a storage bucket for category icons if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for category icons bucket
CREATE POLICY "Category icons are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'category-icons');

CREATE POLICY "Super admins can upload category icons"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'category-icons' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can update category icons"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'category-icons' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can delete category icons"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'category-icons' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);