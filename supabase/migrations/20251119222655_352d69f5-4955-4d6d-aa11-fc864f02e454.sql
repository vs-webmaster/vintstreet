-- First, fix existing rows: set auction_type to NULL for marketplace listings
UPDATE listings 
SET auction_type = NULL 
WHERE auction_type = 'marketplace';

-- Drop the existing check constraint on auction_type
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_auction_type_check;

-- Add a new check constraint that allows 'timed' and 'live' as valid auction types
-- For marketplace listings, auction_type should be NULL
ALTER TABLE listings ADD CONSTRAINT listings_auction_type_check 
  CHECK (auction_type IN ('timed', 'live') OR auction_type IS NULL);