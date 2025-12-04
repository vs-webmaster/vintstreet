-- Fix founders_list RLS policy to use the correct role system
DROP POLICY IF EXISTS "Admins can view founders list" ON public.founders_list;

CREATE POLICY "Admins and super admins can view founders list"
ON public.founders_list
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);