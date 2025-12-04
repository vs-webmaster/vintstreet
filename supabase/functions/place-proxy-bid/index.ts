import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BidRequest {
  auctionId: string;
  maxBidAmount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { auctionId, maxBidAmount }: BidRequest = await req.json();

    // Validate input
    if (!auctionId || !maxBidAmount || maxBidAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid bid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auction details
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*, listings!inner(*)')
      .eq('id', auctionId)
      .single();

    if (auctionError || !auction) {
      console.error('Auction fetch error:', auctionError);
      return new Response(JSON.stringify({ error: 'Auction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if auction is still active
    if (auction.status !== 'active' || new Date(auction.end_time) < new Date()) {
      return new Response(JSON.stringify({ error: 'Auction has ended' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is the seller
    if (auction.listings.seller_id === user.id) {
      return new Response(JSON.stringify({ error: 'Sellers cannot bid on their own auctions' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all current bids for this auction, ordered by max_bid_amount
    const { data: existingBids, error: bidsError } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('max_bid_amount', { ascending: false });

    if (bidsError) {
      console.error('Bids fetch error:', bidsError);
      throw bidsError;
    }

    const currentBids = existingBids || [];

    // Calculate bid increment
    const getBidIncrement = (currentBid: number): number => {
      if (currentBid < 50) return 1;
      if (currentBid < 100) return 2;
      if (currentBid < 500) return 5;
      return 10;
    };

    // Check if user already has a bid
    const userExistingBid = currentBids.find((bid) => bid.bidder_id === user.id);

    // Get the highest competing bid (not from this user)
    const competingBids = currentBids.filter((bid) => bid.bidder_id !== user.id);
    const highestCompetingBid = competingBids.length > 0 ? competingBids[0] : null;

    const currentHighBid = auction.current_bid || auction.starting_bid || 0;
    const increment = getBidIncrement(currentHighBid);

    // Minimum bid must be at least current bid + increment
    const minimumBid = currentHighBid + increment;

    // Validate max bid is high enough
    if (maxBidAmount < minimumBid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Maximum bid must be at least £${minimumBid.toFixed(2)}`,
          minimumBid,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Calculate the new current bid based on proxy bidding logic
    let newCurrentBid: number;
    let newHighestMaxBid: number;
    let leadingBidderId: string;

    if (!highestCompetingBid) {
      // No competing bids - current bid stays at starting bid (or just above it for first bid)
      const startingAmount = auction.starting_bid || 0;
      newCurrentBid = startingAmount > 0 ? startingAmount : increment;
      newHighestMaxBid = maxBidAmount;
      leadingBidderId = user.id;
    } else if (maxBidAmount > highestCompetingBid.max_bid_amount) {
      // User's max bid beats the competition
      // Set current bid to competing max + increment
      newCurrentBid = highestCompetingBid.max_bid_amount + increment;
      newHighestMaxBid = maxBidAmount;
      leadingBidderId = user.id;
    } else if (maxBidAmount === highestCompetingBid.max_bid_amount) {
      // Tie - first bidder wins, but current bid increases
      if (userExistingBid && userExistingBid.created_at < highestCompetingBid.created_at) {
        newCurrentBid = maxBidAmount;
        newHighestMaxBid = maxBidAmount;
        leadingBidderId = user.id;
      } else {
        newCurrentBid = maxBidAmount;
        newHighestMaxBid = highestCompetingBid.max_bid_amount;
        leadingBidderId = highestCompetingBid.bidder_id;
      }
    } else {
      // User's max bid is lower - competing bid wins, current bid = user's max + increment
      newCurrentBid = maxBidAmount + increment;
      newHighestMaxBid = highestCompetingBid.max_bid_amount;
      leadingBidderId = highestCompetingBid.bidder_id;
    }

    // Ensure current bid doesn't exceed winner's max bid
    if (newCurrentBid > newHighestMaxBid) {
      newCurrentBid = newHighestMaxBid;
    }

    // Insert or update the user's bid

    if (userExistingBid) {
      // Update existing bid

      const { error: updateError } = await supabase
        .from('bids')
        .update({
          bid_amount: newCurrentBid,
          max_bid_amount: maxBidAmount,
        })
        .eq('id', userExistingBid.id);

      if (updateError) {
        console.error('Bid update error:', updateError);
        throw updateError;
      }
    } else {
      // Insert new bid

      const { error: insertError } = await supabase.from('bids').insert({
        auction_id: auctionId,
        bidder_id: user.id,
        bid_amount: newCurrentBid,
        max_bid_amount: maxBidAmount,
      });

      if (insertError) {
        console.error('Bid insert error:', insertError);
        throw insertError;
      }
    }

    // Update auction with new current bid and bid count

    const reserveMet = newCurrentBid >= auction.reserve_price;
    const { error: auctionUpdateError } = await supabase
      .from('auctions')
      .update({
        current_bid: newCurrentBid,
        bid_count: currentBids.length + (userExistingBid ? 0 : 1),
        reserve_met: reserveMet,
      })
      .eq('id', auctionId);

    if (auctionUpdateError) {
      console.error('Auction update error:', auctionUpdateError);
      throw auctionUpdateError;
    }

    // Also update the listing's current_bid for backward compatibility

    const { error: listingUpdateError } = await supabase
      .from('listings')
      .update({ current_bid: newCurrentBid })
      .eq('id', auction.listing_id);

    if (listingUpdateError) {
      console.error('Listing update error:', listingUpdateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        currentBid: newCurrentBid,
        isLeading: leadingBidderId === user.id,
        maxBidAmount: maxBidAmount,
        reserveMet,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error processing bid:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to place bid' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
