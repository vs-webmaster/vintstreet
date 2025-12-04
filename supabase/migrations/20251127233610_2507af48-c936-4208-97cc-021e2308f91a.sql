
-- Drop the old constraint
ALTER TABLE shop_hero_images DROP CONSTRAINT shop_hero_images_display_order_check;

-- Add new constraint allowing display_order 0-5 (6 total images)
ALTER TABLE shop_hero_images ADD CONSTRAINT shop_hero_images_display_order_check 
CHECK (display_order >= 0 AND display_order <= 5);
