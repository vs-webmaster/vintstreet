-- Add max_bid_amount column to bids table to support proxy bidding
ALTER TABLE public.bids
ADD COLUMN max_bid_amount numeric NOT NULL DEFAULT 0;

-- Update existing bids to set max_bid_amount equal to bid_amount
UPDATE public.bids
SET max_bid_amount = bid_amount
WHERE max_bid_amount = 0;

-- Add comment explaining the columns
COMMENT ON COLUMN public.bids.bid_amount IS 'The actual current bid amount shown to users';
COMMENT ON COLUMN public.bids.max_bid_amount IS 'The maximum amount the bidder is willing to pay (proxy bid)';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bids_auction_max_bid ON public.bids(auction_id, max_bid_amount DESC);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON public.bids(auction_id, created_at DESC);