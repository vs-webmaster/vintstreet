-- Drop the existing view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.seller_info_view;

-- Create view with SECURITY INVOKER to use querying user's permissions
CREATE VIEW public.seller_info_view
WITH (security_invoker = true)
AS
SELECT 
  sp.user_id,
  sp.shop_name,
  sp.shop_description,
  sp.shop_logo_url,
  sp.display_name_format,
  sp.shop_tagline,
  p.full_name,
  p.username,
  p.avatar_url
FROM public.seller_profiles sp
LEFT JOIN public.profiles p ON p.user_id = sp.user_id;