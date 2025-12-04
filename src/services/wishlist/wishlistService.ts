// Wishlist Service
// Centralized data access for wishlist operations

import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/api';
import { success, failure, isFailure } from '@/types/api';
import { normalizeError, logError, DatabaseError } from '@/lib/errors';

export interface WishlistItem {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings: {
    id: string;
    seller_id: string;
    stream_id: string;
    slug?: string;
    product_name: string;
    starting_price: number;
    discounted_price: number | null;
    thumbnail: string | null;
    status: string;
    auction_type?: string | null;
    seller_profiles?: {
      shop_name: string;
    } | null;
    auctions?:
      | {
          id: string;
          status: string;
          end_time: string;
          current_bid: number | null;
        }[]
      | null;
  } | null;
}

// Load wishlist items for authenticated user
export async function loadWishlist(userId: string): Promise<Result<WishlistItem[]>> {
  try {
    const { data: wishlistItems, error } = await supabase
      .from('wishlist')
      .select(
        '*, listings(id, seller_id, stream_id, slug, product_name, starting_price, discounted_price, thumbnail, status, auction_type, auctions(id, status, end_time, current_bid))',
      )
      .eq('user_id', userId);

    if (error) throw error;

    return success((wishlistItems || []) as unknown as WishlistItem[]);
  } catch (error) {
    logError(error, 'loadWishlist');
    return failure(normalizeError(error));
  }
}

// Check if item exists in wishlist
export async function checkWishlistItem(userId: string, listingId: string): Promise<Result<boolean>> {
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      throw error;
    }

    return success(!!data);
  } catch (error) {
    logError(error, 'checkWishlistItem');
    return failure(normalizeError(error));
  }
}

// Add item to wishlist
export async function addToWishlist(userId: string, listingId: string): Promise<Result<WishlistItem>> {
  try {
    // Check if item already exists
    const exists = await checkWishlistItem(userId, listingId);
    if (exists.success && exists.data) {
      // Item already in wishlist, return existing item
      const wishlistResult = await loadWishlist(userId);
      if (isFailure(wishlistResult)) {
        return wishlistResult;
      }
      const item = wishlistResult.data.find((item) => item.listing_id === listingId);
      if (item) {
        return success(item);
      }
    }

    // Insert into wishlist
    const { data, error } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        listing_id: listingId,
      })
      .select(
        '*, listings(id, seller_id, stream_id, slug, product_name, starting_price, discounted_price, thumbnail, status, auction_type, auctions(id, status, end_time, current_bid))',
      )
      .single();

    if (error) throw error;

    return success(data as unknown as WishlistItem);
  } catch (error) {
    logError(error, 'addToWishlist');
    return failure(normalizeError(error));
  }
}

// Remove item from wishlist
export async function removeFromWishlist(userId: string, listingId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('wishlist').delete().eq('user_id', userId).eq('listing_id', listingId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'removeFromWishlist');
    return failure(normalizeError(error));
  }
}

// Clear all items from wishlist
export async function clearWishlist(userId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('wishlist').delete().eq('user_id', userId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'clearWishlist');
    return failure(normalizeError(error));
  }
}

// Toggle item in wishlist
export async function toggleWishlistItem(
  userId: string,
  listingId: string,
): Promise<Result<{ added: boolean; item: WishlistItem | null }>> {
  try {
    const exists = await checkWishlistItem(userId, listingId);

    if (exists.success && exists.data) {
      // Remove from wishlist
      const removeResult = await removeFromWishlist(userId, listingId);
      if (isFailure(removeResult)) {
        return removeResult;
      }
      return success({ added: false, item: null });
    } else {
      // Add to wishlist
      const addResult = await addToWishlist(userId, listingId);
      if (isFailure(addResult)) {
        return addResult;
      }
      return success({ added: true, item: addResult.data });
    }
  } catch (error) {
    logError(error, 'toggleWishlistItem');
    return failure(normalizeError(error));
  }
}

// Shared Wishlist functions
export interface SharedWishlist {
  id: string;
  user_id: string;
  share_token: string;
  name?: string | null;
  description?: string | null;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export interface PublicWishlistData {
  sharedWishlist: SharedWishlist;
  wishlistItems: WishlistItem[];
  ownerName: string;
}

// Fetch shared wishlist by token
export async function fetchSharedWishlistByToken(shareToken: string): Promise<Result<SharedWishlist | null>> {
  try {
    const { data, error } = await supabase
      .from('shared_wishlists')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    // Check if expired
    if (data && data.expires_at && new Date(data.expires_at) < new Date()) {
      return success(null);
    }

    return success((data || null) as SharedWishlist | null);
  } catch (error) {
    logError(error, 'fetchSharedWishlistByToken');
    return failure(normalizeError(error));
  }
}

// Fetch shared wishlist for user
export async function fetchSharedWishlistByUserId(userId: string): Promise<Result<SharedWishlist | null>> {
  try {
    const { data, error } = await supabase
      .from('shared_wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    return success((data || null) as SharedWishlist | null);
  } catch (error) {
    logError(error, 'fetchSharedWishlistByUserId');
    return failure(normalizeError(error));
  }
}

// Increment view count for shared wishlist
export async function incrementSharedWishlistView(shareId: string): Promise<Result<boolean>> {
  try {
    // First get current view count
    const { data: current } = await supabase.from('shared_wishlists').select('view_count').eq('id', shareId).single();

    if (!current) {
      return failure(new DatabaseError('Shared wishlist not found'));
    }

    const { error } = await supabase
      .from('shared_wishlists')
      .update({ view_count: (current.view_count || 0) + 1 })
      .eq('id', shareId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'incrementSharedWishlistView');
    return failure(normalizeError(error));
  }
}

// Deactivate shared wishlist
export async function deactivateSharedWishlist(shareId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('shared_wishlists').update({ is_active: false }).eq('id', shareId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'deactivateSharedWishlist');
    return failure(normalizeError(error));
  }
}

// Fetch public wishlist data (shared wishlist with items)
export async function fetchPublicWishlistData(shareToken: string): Promise<Result<PublicWishlistData>> {
  try {
    // Fetch shared wishlist
    const sharedResult = await fetchSharedWishlistByToken(shareToken);
    if (isFailure(sharedResult) || !sharedResult.data) {
      return failure(new DatabaseError('Shared wishlist not found or inactive'));
    }

    const sharedWishlist = sharedResult.data;

    // Increment view count
    await incrementSharedWishlistView(sharedWishlist.id);

    // Fetch wishlist items
    const wishlistResult = await loadWishlist(sharedWishlist.user_id);
    if (isFailure(wishlistResult)) {
      return failure(new DatabaseError('Failed to load wishlist items'));
    }

    const wishlistItems = wishlistResult.data || [];

    // Fetch owner profile
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('user_id', sharedWishlist.user_id)
      .single();

    const ownerName = ownerProfile?.username || ownerProfile?.full_name || 'Someone';

    return success({
      sharedWishlist,
      wishlistItems,
      ownerName,
    });
  } catch (error) {
    logError(error, 'fetchPublicWishlistData');
    return failure(normalizeError(error));
  }
}
