-- Enable RLS on no_products_settings if not already enabled
ALTER TABLE public.no_products_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can insert no products settings" ON public.no_products_settings;
DROP POLICY IF EXISTS "Admin users can update no products settings" ON public.no_products_settings;
DROP POLICY IF EXISTS "Anyone can view no products settings" ON public.no_products_settings;

-- Allow anyone to read the settings
CREATE POLICY "Anyone can view no products settings"
ON public.no_products_settings
FOR SELECT
TO public
USING (true);

-- Allow admin users to insert settings
CREATE POLICY "Admin users can insert no products settings"
ON public.no_products_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])
  )
);

-- Allow admin users to update settings
CREATE POLICY "Admin users can update no products settings"
ON public.no_products_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])
  )
);