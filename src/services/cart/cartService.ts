// Cart Service
// Centralized data access for cart operations

import { supabase } from '@/integrations/supabase/client';
import { DatabaseError, NotFoundError, normalizeError, logError } from '@/lib/errors';
import type { Result } from '@/types/api';
import { success, failure, isFailure } from '@/types/api';

export interface CartItem {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings: {
    id: string;
    seller_id: string;
    stream_id: string;
    product_name: string;
    starting_price: number;
    discounted_price: number;
    thumbnail: string;
    status: string;
    weight: number | null;
    seller_info_view?: {
      shop_name: string;
      display_name_format: string;
      full_name: string;
      username: string;
      avatar_url: string;
    };
  } | null;
}

const GUEST_CART_KEY = 'guest_cart';

// Load cart items for authenticated user
export async function loadCart(userId: string): Promise<Result<CartItem[]>> {
  try {
    const { data: cartItems, error } = await supabase
      .from('cart')
      .select(
        '*, listings(id, seller_id, stream_id, product_name, starting_price, discounted_price, thumbnail, status, weight)',
      )
      .eq('user_id', userId);

    if (error) {
      logError(error, 'loadCart');
      return failure(normalizeError(error));
    }

    return success((cartItems || []) as unknown as CartItem[]);
  } catch (error) {
    logError(error, 'loadCart');
    return failure(normalizeError(error));
  }
}

// Check if listing exists and is not an auction
async function validateListingForCart(listingId: string): Promise<Result<boolean>> {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('auction_type')
      .eq('id', listingId)
      .single();

    if (error) throw error;
    if (!listing) {
      return failure(new NotFoundError('Listing', listingId));
    }

    if (listing.auction_type && listing.auction_type !== 'marketplace') {
      return failure(new DatabaseError('Auction items cannot be added to cart. Please place a bid instead.'));
    }

    return success(true);
  } catch (error) {
    logError(error, 'validateListingForCart');
    return failure(normalizeError(error));
  }
}

// Check if item exists in cart
export async function checkCartItem(userId: string, listingId: string): Promise<Result<boolean>> {
  try {
    const { data, error } = await supabase
      .from('cart')
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
    logError(error, 'checkCartItem');
    return failure(normalizeError(error));
  }
}

// Add item to cart
export async function addToCart(userId: string, listingId: string): Promise<Result<CartItem>> {
  try {
    // Validate listing
    const validation = await validateListingForCart(listingId);
    if (isFailure(validation)) {
      return validation;
    }

    // Check if already in cart
    const exists = await checkCartItem(userId, listingId);
    if (exists.success && exists.data) {
      // Item already in cart, return success
      const cartResult = await loadCart(userId);
      if (isFailure(cartResult)) {
        return cartResult;
      }
      const item = cartResult.data.find((item) => item.listing_id === listingId);
      if (item) {
        return success(item);
      }
    }

    // Insert into cart
    const { data, error } = await supabase
      .from('cart')
      .insert({
        user_id: userId,
        listing_id: listingId,
      })
      .select(
        '*, listings(id, seller_id, stream_id, product_name, starting_price, discounted_price, thumbnail, status, weight)',
      )
      .single();

    if (error) throw error;

    return success(data as unknown as CartItem);
  } catch (error) {
    logError(error, 'addToCart');
    return failure(normalizeError(error));
  }
}

// Remove item from cart
export async function removeFromCart(userId: string, listingId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('cart').delete().eq('user_id', userId).eq('listing_id', listingId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'removeFromCart');
    return failure(normalizeError(error));
  }
}

// Clear all items from cart
export async function clearCart(userId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('cart').delete().eq('user_id', userId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'clearCart');
    return failure(normalizeError(error));
  }
}

// Merge guest cart items into user cart
export async function mergeGuestCart(userId: string, listingIds: string[]): Promise<Result<CartItem[]>> {
  try {
    for (const listingId of listingIds) {
      // Check if item already exists in DB cart
      const exists = await checkCartItem(userId, listingId);
      if (!exists.success || !exists.data) {
        // Validate and add
        const validation = await validateListingForCart(listingId);
        if (validation.success) {
          await addToCart(userId, listingId);
        }
      }
    }

    // Load full cart
    const cartResult = await loadCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }

    return success(cartResult.data);
  } catch (error) {
    logError(error, 'mergeGuestCart');
    return failure(normalizeError(error));
  }
}

// Load guest cart items (from localStorage + fetch listings)
export async function loadGuestCart(): Promise<Result<CartItem[]>> {
  try {
    const guestCart = localStorage.getItem(GUEST_CART_KEY);
    if (!guestCart) {
      return success([]);
    }

    const listingIds: string[] = JSON.parse(guestCart);
    if (!listingIds || listingIds.length === 0) {
      return success([]);
    }

    // Fetch listing details for guest cart
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, seller_id, stream_id, product_name, starting_price, discounted_price, thumbnail, status, weight')
      .in('id', listingIds);

    if (error) throw error;

    // Transform to CartItem format
    const cartItems = listingIds
      .map((listingId, index) => {
        const listing = listings?.find((l) => l.id === listingId);
        return {
          id: `guest-${index}`,
          user_id: 'guest',
          listing_id: listingId,
          created_at: new Date().toISOString(),
          listings: listing || null,
        };
      })
      .filter((item) => item.listings !== null) as CartItem[];

    return success(cartItems);
  } catch (error) {
    logError(error, 'loadGuestCart');
    return failure(normalizeError(error));
  }
}

// Guest cart utilities (localStorage)
export const guestCartUtils = {
  getGuestCart(): string[] {
    try {
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      return guestCart ? JSON.parse(guestCart) : [];
    } catch {
      return [];
    }
  },

  addToGuestCart(listingId: string): void {
    const cartIds = this.getGuestCart();
    if (!cartIds.includes(listingId)) {
      cartIds.push(listingId);
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartIds));
    }
  },

  removeFromGuestCart(listingId: string): void {
    const cartIds = this.getGuestCart();
    const updatedIds = cartIds.filter((id: string) => id !== listingId);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedIds));
  },

  clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
  },
};
