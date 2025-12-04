// Auction Service
// Centralized data access for auction operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMaybeNull, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

// Auction interfaces
export interface Auction {
  id: string;
  listing_id: string;
  status: string;
  starting_bid: number;
  current_bid: number | null;
  end_time: string;
  bid_count: number;
  reserve_met: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bid_amount: number;
  max_bid_amount?: number;
  created_at: string;
  updated_at?: string;
}

// Fetch auction by listing ID (for active auctions)
export async function fetchAuctionByListingId(listingId: string): Promise<Result<Auction | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .eq('listing_id', listingId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return { data: (data as Auction) || null, error: null };
  }, 'fetchAuctionByListingId');
}

// Fetch auction data by listing ID (for editing, without status filter)
export async function fetchAuctionDataByListingId(listingId: string): Promise<
  Result<{
    reserve_price: number | null;
    starting_bid: number;
    auction_duration: number;
  } | null>
> {
  return withMaybeNull(async () => {
    return await supabase
      .from('auctions')
      .select('reserve_price, starting_bid, auction_duration')
      .eq('listing_id', listingId)
      .maybeSingle();
  }, 'fetchAuctionDataByListingId');
}

// Check if auction exists for listing ID
export async function checkAuctionExistsByListingId(listingId: string): Promise<Result<{ id: string } | null>> {
  return withMaybeNull(async () => {
    const { data, error } = await supabase
      .from('auctions')
      .select('id')
      .eq('listing_id', listingId)
      .maybeSingle();

    if (error) throw error;
    return { data: (data as { id: string }) || null, error: null };
  }, 'checkAuctionExistsByListingId');
}

// Fetch bids for an auction
export async function fetchBidsByAuctionId(auctionId: string): Promise<Result<Bid[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Bid[], error: null };
  }, 'fetchBidsByAuctionId');
}

// Place a bid
export async function placeBid(auctionId: string, bidderId: string, bidAmount: number): Promise<Result<Bid>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('bids')
      .insert({
        auction_id: auctionId,
        bidder_id: bidderId,
        bid_amount: bidAmount,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Bid, error: null };
  }, 'placeBid');
}

// Fetch auction by ID
export async function fetchAuctionById(auctionId: string): Promise<Result<Auction | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('auctions').select('*').eq('id', auctionId).maybeSingle();

    if (error) throw error;
    return { data: (data as Auction) || null, error: null };
  }, 'fetchAuctionById');
}

// Create auction
export async function createAuction(input: {
  listing_id: string;
  reserve_price?: number;
  starting_bid: number;
  current_bid?: number;
  auction_duration: number;
  start_time: string;
  end_time: string;
  status?: string;
}): Promise<Result<Auction>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('auctions')
      .insert({
        listing_id: input.listing_id,
        reserve_price: input.reserve_price || null,
        starting_bid: input.starting_bid,
        current_bid: input.current_bid ?? input.starting_bid,
        auction_duration: input.auction_duration,
        start_time: input.start_time,
        end_time: input.end_time,
        status: input.status || 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Auction, error: null };
  }, 'createAuction');
}

// Update auction
export async function updateAuction(
  auctionId: string,
  updates: {
    reserve_price?: number;
    starting_bid?: number;
    auction_duration?: number;
    start_time?: string;
    end_time?: string;
    status?: string;
  },
): Promise<Result<Auction>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('auctions').update(updates).eq('id', auctionId).select().single();

    if (error) throw error;
    return { data: data as Auction, error: null };
  }, 'updateAuction');
}

// Cancel auction by listing ID
export async function cancelAuctionByListingId(listingId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('auctions')
      .update({ status: 'cancelled' })
      .eq('listing_id', listingId)
      .eq('status', 'active');

    if (error) throw error;
    return { data: true, error: null };
  }, 'cancelAuctionByListingId');
}
