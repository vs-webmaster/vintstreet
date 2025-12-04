-- Add custom_link column to shop_sections table
ALTER TABLE shop_sections 
ADD COLUMN IF NOT EXISTS custom_link TEXT;

COMMENT ON COLUMN shop_sections.custom_link IS 'Optional custom link for the View All button, overrides default category link';