-- Add showcase_image column to listings table for featured product showcase
ALTER TABLE listings ADD COLUMN IF NOT EXISTS showcase_image TEXT;

COMMENT ON COLUMN listings.showcase_image IS 'Image URL for product showcase page (typically background-removed version)';

-- Add view_count column to track product views
ALTER TABLE listings ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

COMMENT ON COLUMN listings.view_count IS 'Number of times product has been viewed';