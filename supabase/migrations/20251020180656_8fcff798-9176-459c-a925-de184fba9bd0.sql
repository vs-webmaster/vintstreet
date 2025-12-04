-- Update status column to include 'private' option
ALTER TABLE listings 
DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE listings 
ADD CONSTRAINT listings_status_check 
CHECK (status IN ('draft', 'published', 'archived', 'private'));

-- Update comment to reflect new status
COMMENT ON COLUMN listings.status IS 'Product status: draft (incomplete), published (live on marketplace), private (published but shop-only), archived (delisted)';