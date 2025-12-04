-- Add shop_tagline field to seller_profiles for one-liner under shop name
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS shop_tagline text;