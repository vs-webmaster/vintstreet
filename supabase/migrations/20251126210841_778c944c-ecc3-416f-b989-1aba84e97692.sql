-- Allow super admin users to upload shop banners to product-images bucket
-- This fixes the RLS issue when uploading banner images

-- Policy for INSERT (upload)
CREATE POLICY "Super admins can upload banners to product-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (
    -- Allow super admins to upload anywhere
    public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Policy for SELECT (read) - make sure admins can read all files
CREATE POLICY "Super admins can read all product-images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Policy for UPDATE - allow admins to update
CREATE POLICY "Super admins can update product-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Policy for DELETE - allow admins to delete
CREATE POLICY "Super admins can delete product-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'super_admin'::app_role)
);