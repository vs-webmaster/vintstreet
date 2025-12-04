-- Add status column to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' 
CHECK (status IN ('draft', 'published', 'archived'));

-- Update existing records to have published status if they're active
UPDATE listings 
SET status = CASE 
  WHEN is_active = true THEN 'published' 
  ELSE 'draft' 
END
WHERE status IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN listings.status IS 'Product status: draft (incomplete), published (active), archived (delisted)';

-- Create index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);