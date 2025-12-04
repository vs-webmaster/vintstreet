-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reserve_price NUMERIC NOT NULL,
  starting_bid NUMERIC,
  current_bid NUMERIC DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  reserve_met BOOLEAN DEFAULT FALSE,
  auction_duration INTEGER NOT NULL CHECK (auction_duration IN (1, 3, 5, 7, 10)),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  bid_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_auctions_listing_id ON auctions(listing_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);

-- Enable RLS
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Auctions policies
CREATE POLICY "Auctions are viewable by everyone"
  ON auctions FOR SELECT
  USING (true);

CREATE POLICY "Sellers can create auctions for their listings"
  ON auctions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update their own auctions"
  ON auctions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.seller_id = auth.uid()
    )
  );

-- Bids policies
CREATE POLICY "Bids are viewable by everyone"
  ON bids FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can place bids"
  ON bids FOR INSERT
  WITH CHECK (auth.uid() = bidder_id);

-- Add auction_type to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS auction_type TEXT DEFAULT 'marketplace' CHECK (auction_type IN ('marketplace', 'auction'));

-- Create trigger to update auctions updated_at
CREATE OR REPLACE FUNCTION update_auctions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_auctions_updated_at
  BEFORE UPDATE ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION update_auctions_updated_at();

-- Enable realtime for auctions and bids
ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;