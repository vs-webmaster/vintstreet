-- Update Amy's shop to be the VintStreet System seller
UPDATE public.seller_profiles
SET 
  shop_name = 'VintStreet System',
  business_name = 'VintStreet Ltd',
  shop_description = COALESCE(shop_description, 'Official VintStreet marketplace system account for master product listings'),
  shop_tagline = COALESCE(shop_tagline, 'Your Trusted Marketplace'),
  display_name_format = 'shop_name',
  updated_at = now()
WHERE user_id = 'd0d56213-5433-4af5-9aa9-1e3f1a701781';