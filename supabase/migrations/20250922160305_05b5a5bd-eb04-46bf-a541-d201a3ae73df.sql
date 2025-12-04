-- Create listings table for products that can be bid on
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_image TEXT,
  starting_price DECIMAL(10,2) NOT NULL,
  current_bid DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  auction_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bids table for tracking all bids
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Policies for listings
CREATE POLICY "Listings are viewable by everyone" 
ON public.listings 
FOR SELECT 
USING (true);

CREATE POLICY "Sellers can create their own listings" 
ON public.listings 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings" 
ON public.listings 
FOR UPDATE 
USING (auth.uid() = seller_id);

-- Policies for bids
CREATE POLICY "Bids are viewable by everyone" 
ON public.bids 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create bids" 
ON public.bids 
FOR INSERT 
WITH CHECK (auth.uid() = bidder_id);

-- Add triggers for updated_at
CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER TABLE public.listings REPLICA IDENTITY FULL;
ALTER TABLE public.bids REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;