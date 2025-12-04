/**
 * Shipping utility functions
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Check if an order is a warehouse fulfillment order
 * Warehouse orders are identified by:
 * 1. Listing stream_id is "master-catalog", OR
 * 2. Seller shop_name is "VintStreet System"
 */
export async function isWarehouseOrder(sellerId: string, listingId?: string): Promise<boolean> {
  try {
    // First check listing stream_id if listingId is provided
    if (listingId) {
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('stream_id')
        .eq('id', listingId)
        .single();

      if (!listingError && listing?.stream_id === 'master-catalog') {
        return true;
      }
    }

    // Fallback: check seller profile
    const { data, error } = await supabase.from('seller_profiles').select('shop_name').eq('user_id', sellerId).single();

    if (error) {
      console.error('Error checking warehouse order:', error);
      return false;
    }

    return data?.shop_name === 'VintStreet System';
  } catch (error) {
    console.error('Error checking warehouse order:', error);
    return false;
  }
}

/**
 * Get warehouse seller ID (VintStreet System)
 */
export async function getWarehouseSellerId(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('user_id')
      .eq('shop_name', 'VintStreet System')
      .single();

    if (error) {
      console.error('Error getting warehouse seller ID:', error);
      return null;
    }

    return data?.user_id || null;
  } catch (error) {
    console.error('Error getting warehouse seller ID:', error);
    return null;
  }
}

/**
 * Format order number for display
 */
export function formatOrderNumber(orderId: string): string {
  return `ORD-${orderId.slice(-8).toUpperCase()}`;
}

/**
 * Generate unique request ID for API calls
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
