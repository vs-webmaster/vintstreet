-- Add moderation status to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Add moderation reason field
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Create index for moderation queries
CREATE INDEX IF NOT EXISTS idx_listings_moderation_status ON listings(moderation_status) WHERE moderation_status = 'pending';

-- Update existing rows to have approved status
UPDATE listings SET moderation_status = 'approved' WHERE moderation_status IS NULL;