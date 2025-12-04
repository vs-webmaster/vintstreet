-- Create a view for seller info that joins seller_profiles with profiles
CREATE OR REPLACE VIEW public.seller_info_view AS
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

-- Grant access to the view
GRANT SELECT ON public.seller_info_view TO authenticated;
GRANT SELECT ON public.seller_info_view TO anon;