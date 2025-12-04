-- Add rotation interval and button styling columns to shop_banners
ALTER TABLE public.shop_banners 
ADD COLUMN rotation_interval INTEGER DEFAULT 6,
ADD COLUMN button_bg_color TEXT DEFAULT '#000000',
ADD COLUMN button_text_color TEXT DEFAULT '#FFFFFF';