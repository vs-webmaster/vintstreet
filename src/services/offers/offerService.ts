// Offers Service
// Centralized data access for offer operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offer_amount: number;
  message: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  listings?: {
    id: string;
    product_name: string;
    thumbnail: string | null;
    starting_price: number;
  };
}

export interface CreateOfferInput {
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offer_amount: number;
  message?: string | null;
  status?: string;
  expires_at?: string | null;
}

export interface UpdateOfferStatusInput {
  status: 'accepted' | 'declined' | 'pending';
}

// Create a new offer
export async function createOffer(input: CreateOfferInput): Promise<Result<Offer>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('offers')
      .insert({
        listing_id: input.listing_id,
        buyer_id: input.buyer_id,
        seller_id: input.seller_id,
        offer_amount: input.offer_amount,
        message: input.message || null,
        status: input.status || 'pending',
        expires_at: input.expires_at || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Offer, error: null };
  }, 'createOffer');
}

// Fetch offers for a seller
export async function fetchOffersBySeller(sellerId: string, filters?: { status?: string }): Promise<Result<Offer[]>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('offers')
      .select('*, listings(id, product_name, thumbnail, starting_price)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as Offer[], error: null };
  }, 'fetchOffersBySeller');
}

// Fetch offers for a buyer
export async function fetchOffersByBuyer(buyerId: string, filters?: { status?: string }): Promise<Result<Offer[]>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('offers')
      .select('*, listings(id, product_name, thumbnail, starting_price)')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as Offer[], error: null };
  }, 'fetchOffersByBuyer');
}

// Fetch offers for a buyer with detailed listing and category information
export interface OfferWithDetails extends Offer {
  listing?: {
    id: string;
    product_name: string;
    thumbnail: string | null;
    starting_price: number;
    category_id: string | null;
    product_categories?: {
      name: string;
    } | null;
  };
  payment_completed?: boolean;
}

export async function fetchOffersByBuyerWithDetails(buyerId: string): Promise<Result<OfferWithDetails[]>> {
  return withErrorHandling(async () => {
    // Fetch offers
    const { data: offersData, error: offersError } = await supabase
      .from('offers')
      .select('id, listing_id, seller_id, offer_amount, message, status, created_at')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (offersError) throw offersError;
    if (!offersData || offersData.length === 0) return { data: [], error: null };

    // Check for orders to determine payment status for accepted offers
    const acceptedOfferIds = offersData.filter((o) => o.status === 'accepted').map((o) => o.id);
    let paidListingIds = new Set<string>();

    if (acceptedOfferIds.length > 0) {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('listing_id')
        .eq('buyer_id', buyerId)
        .in(
          'listing_id',
          offersData.map((o) => o.listing_id),
        );

      if (ordersData) {
        paidListingIds = new Set(ordersData.map((o) => o.listing_id));
      }
    }

    // Fetch listing details with category information
    const listingIds = offersData.map((o) => o.listing_id);
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select(
        `
        id, 
        product_name, 
        thumbnail, 
        starting_price,
        category_id,
        product_categories(name)
      `,
      )
      .in('id', listingIds);

    if (listingsError) throw listingsError;

    // Combine offers with listing details
    const offersWithListings = offersData.map((offer) => {
      const listing = listingsData?.find((l) => l.id === offer.listing_id);
      const paymentCompleted = paidListingIds.has(offer.listing_id);
      return {
        ...offer,
        payment_completed: paymentCompleted,
        listing: listing
          ? {
              id: listing.id,
              product_name: listing.product_name,
              thumbnail: listing.thumbnail,
              starting_price: listing.starting_price,
              category_id: listing.category_id,
              product_categories: listing.product_categories,
            }
          : undefined,
      };
    });

    return { data: offersWithListings as OfferWithDetails[], error: null };
  }, 'fetchOffersByBuyerWithDetails');
}

// Update offer status
export async function updateOfferStatus(
  offerId: string,
  status: 'accepted' | 'declined' | 'pending',
): Promise<Result<Offer>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('offers').update({ status }).eq('id', offerId).select().single();

    if (error) throw error;
    return { data: data as Offer, error: null };
  }, 'updateOfferStatus');
}

// Fetch a single offer by ID
export async function fetchOfferById(offerId: string): Promise<Result<Offer>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*, listings(id, product_name, thumbnail, starting_price)')
      .eq('id', offerId)
      .single();

    if (error) throw error;
    return { data: data as Offer, error: null };
  }, 'fetchOfferById');
}

// Get count of pending offers for a seller
export async function getPendingOfferCount(sellerId: string): Promise<Result<number>> {
  return withErrorHandling(async () => {
    const { count, error } = await supabase
      .from('offers')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'pending');

    if (error) throw error;
    return { data: count || 0, error: null };
  }, 'getPendingOfferCount');
}

// Delete an offer
export async function deleteOffer(offerId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('offers').delete().eq('id', offerId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteOffer');
}
