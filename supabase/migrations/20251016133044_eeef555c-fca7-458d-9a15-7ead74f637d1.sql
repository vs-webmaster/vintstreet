-- Add display_name_format field to seller_profiles
ALTER TABLE public.seller_profiles 
ADD COLUMN IF NOT EXISTS display_name_format text DEFAULT 'shop_name' CHECK (display_name_format IN ('shop_name', 'personal_name'));