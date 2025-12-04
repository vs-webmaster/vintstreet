// Shipping Service
// Centralized data access for shipping-related operations

import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/api';
import { success, failure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

// ==================== SHIPPING PROVIDERS ====================

export interface ShippingProviderRow {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch all active shipping providers
export async function fetchShippingProviders(): Promise<Result<ShippingProviderRow[]>> {
  try {
    const { data, error } = await supabase
      .from('shipping_providers')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    return success((data || []) as ShippingProviderRow[]);
  } catch (error) {
    logError(error, 'shippingService:fetchShippingProviders');
    return failure(normalizeError(error));
  }
}

// Fetch all shipping providers (including inactive) - for admin
export async function fetchAllShippingProviders(): Promise<Result<ShippingProviderRow[]>> {
  try {
    const { data, error } = await supabase.from('shipping_providers').select('*').order('display_order');

    if (error) throw error;

    return success((data || []) as ShippingProviderRow[]);
  } catch (error) {
    logError(error, 'shippingService:fetchAllShippingProviders');
    return failure(normalizeError(error));
  }
}

export interface CreateShippingProviderInput {
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  display_order: number;
}

export interface UpdateShippingProviderInput {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  display_order?: number;
}

// Create shipping provider
export async function createShippingProvider(input: CreateShippingProviderInput): Promise<Result<ShippingProviderRow>> {
  try {
    const { data, error } = await supabase.from('shipping_providers').insert(input).select().single();

    if (error) throw error;

    return success(data as ShippingProviderRow);
  } catch (error) {
    logError(error, 'shippingService:createShippingProvider');
    return failure(normalizeError(error));
  }
}

// Update shipping provider
export async function updateShippingProvider(
  providerId: string,
  input: UpdateShippingProviderInput,
): Promise<Result<ShippingProviderRow>> {
  try {
    const { data, error } = await supabase
      .from('shipping_providers')
      .update(input)
      .eq('id', providerId)
      .select()
      .single();

    if (error) throw error;

    return success(data as ShippingProviderRow);
  } catch (error) {
    logError(error, 'shippingService:updateShippingProvider');
    return failure(normalizeError(error));
  }
}

// Delete shipping provider
export async function deleteShippingProvider(providerId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('shipping_providers').delete().eq('id', providerId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'shippingService:deleteShippingProvider');
    return failure(normalizeError(error));
  }
}

// ==================== SHIPPING PROVIDER PRICES ====================

export interface ProviderPriceRow {
  id: string;
  provider_id: string;
  band_name: string | null;
  min_weight: number | null;
  max_weight: number | null;
  price: number;
  currency: string;
}

// Fetch all shipping provider prices
export async function fetchShippingProviderPrices(): Promise<Result<ProviderPriceRow[]>> {
  try {
    const { data, error } = await supabase.from('shipping_provider_prices').select('*');

    if (error) throw error;

    return success((data || []) as ProviderPriceRow[]);
  } catch (error) {
    logError(error, 'shippingService:fetchShippingProviderPrices');
    return failure(normalizeError(error));
  }
}

// Fetch shipping provider prices by provider ID
export async function fetchShippingProviderPricesByProvider(providerId: string): Promise<Result<ProviderPriceRow[]>> {
  try {
    const { data, error } = await supabase
      .from('shipping_provider_prices')
      .select('*')
      .eq('provider_id', providerId)
      .order('min_weight');

    if (error) throw error;

    return success((data || []) as ProviderPriceRow[]);
  } catch (error) {
    logError(error, 'shippingService:fetchShippingProviderPricesByProvider');
    return failure(normalizeError(error));
  }
}

export interface CreateProviderPriceInput {
  provider_id: string;
  band_name?: string | null;
  min_weight?: number | null;
  max_weight?: number | null;
  price: number;
  currency?: string;
  band_id?: string | null;
}

export interface UpdateProviderPriceInput {
  band_name?: string | null;
  min_weight?: number | null;
  max_weight?: number | null;
  price?: number;
  currency?: string;
  band_id?: string | null;
}

// Create shipping provider price
export async function createShippingProviderPrice(input: CreateProviderPriceInput): Promise<Result<ProviderPriceRow>> {
  try {
    const { data, error } = await supabase
      .from('shipping_provider_prices')
      .insert({
        ...input,
        currency: input.currency || 'GBP',
      })
      .select()
      .single();

    if (error) throw error;

    return success(data as ProviderPriceRow);
  } catch (error) {
    logError(error, 'shippingService:createShippingProviderPrice');
    return failure(normalizeError(error));
  }
}

// Update shipping provider price
export async function updateShippingProviderPrice(
  priceId: string,
  input: UpdateProviderPriceInput,
): Promise<Result<ProviderPriceRow>> {
  try {
    const { data, error } = await supabase
      .from('shipping_provider_prices')
      .update(input)
      .eq('id', priceId)
      .select()
      .single();

    if (error) throw error;

    return success(data as ProviderPriceRow);
  } catch (error) {
    logError(error, 'shippingService:updateShippingProviderPrice');
    return failure(normalizeError(error));
  }
}

// Delete shipping provider price
export async function deleteShippingProviderPrice(priceId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('shipping_provider_prices').delete().eq('id', priceId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'shippingService:deleteShippingProviderPrice');
    return failure(normalizeError(error));
  }
}

// Get provider band for a specific weight
export function getProviderBandForWeight(
  providerPrices: ProviderPriceRow[],
  providerId: string | null,
  totalWeightKg: number,
): ProviderPriceRow | null {
  if (!providerId || providerPrices.length === 0) return null;

  const isInWeightRange = (row: ProviderPriceRow, weight: number): boolean =>
    row.min_weight != null && row.max_weight != null && weight >= row.min_weight && weight <= row.max_weight;

  return providerPrices.reduce<ProviderPriceRow | null>((best, row) => {
    if (row.provider_id !== providerId) return best;
    if (!isInWeightRange(row, totalWeightKg)) return best;
    if (!best || row.price < best.price) return row;
    return best;
  }, null);
}

// ==================== SHIPPING OPTIONS ====================

export interface ShippingOptionRow {
  id: string;
  seller_id: string;
  provider_id: string | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  shipping_providers?: {
    name: string;
    description?: string | null;
    display_order?: number;
  } | null;
}

// Fetch shipping options by seller IDs
export async function fetchShippingOptionsBySellers(sellerIds: string[]): Promise<Result<ShippingOptionRow[]>> {
  try {
    if (sellerIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('shipping_options')
      .select('*, shipping_providers(name, description, display_order)')
      .in('seller_id', sellerIds)
      .eq('is_active', true);

    if (error) throw error;

    return success((data || []) as ShippingOptionRow[]);
  } catch (error) {
    logError(error, 'shippingService:fetchShippingOptionsBySellers');
    return failure(normalizeError(error));
  }
}

// Fetch shipping options by seller ID
export async function fetchShippingOptionsBySeller(sellerId: string): Promise<Result<ShippingOptionRow[]>> {
  try {
    const { data, error } = await supabase
      .from('shipping_options')
      .select('*, shipping_providers(name, description, display_order)')
      .eq('seller_id', sellerId);

    if (error) throw error;

    return success((data || []) as ShippingOptionRow[]);
  } catch (error) {
    logError(error, 'shippingService:fetchShippingOptionsBySeller');
    return failure(normalizeError(error));
  }
}

// Check if seller has shipping options configured
export async function checkSellerHasShippingOptions(sellerId: string): Promise<Result<boolean>> {
  try {
    const { data, error } = await supabase.from('shipping_options').select('id').eq('seller_id', sellerId).limit(1);

    if (error) throw error;
    return success((data?.length || 0) > 0);
  } catch (error) {
    logError(error, 'shippingService:checkSellerHasShippingOptions');
    return failure(normalizeError(error));
  }
}

export interface CreateShippingOptionInput {
  seller_id: string;
  provider_id: string;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  is_active?: boolean;
}

export interface UpdateShippingOptionInput {
  provider_id?: string;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  is_active?: boolean;
}

// Create shipping option
export async function createShippingOption(input: CreateShippingOptionInput): Promise<Result<ShippingOptionRow>> {
  try {
    const { data, error } = await supabase.from('shipping_options').insert(input).select().single();

    if (error) throw error;

    return success(data as ShippingOptionRow);
  } catch (error) {
    logError(error, 'shippingService:createShippingOption');
    return failure(normalizeError(error));
  }
}

// Update shipping option
export async function updateShippingOption(
  optionId: string,
  input: UpdateShippingOptionInput,
): Promise<Result<ShippingOptionRow>> {
  try {
    const { data, error } = await supabase.from('shipping_options').update(input).eq('id', optionId).select().single();

    if (error) throw error;

    return success(data as ShippingOptionRow);
  } catch (error) {
    logError(error, 'shippingService:updateShippingOption');
    return failure(normalizeError(error));
  }
}

// Delete shipping option
export async function deleteShippingOption(optionId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('shipping_options').delete().eq('id', optionId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'shippingService:deleteShippingOption');
    return failure(normalizeError(error));
  }
}

// Delete all shipping options for a seller
export async function deleteShippingOptionsBySeller(sellerId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('shipping_options').delete().eq('seller_id', sellerId);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'shippingService:deleteShippingOptionsBySeller');
    return failure(normalizeError(error));
  }
}

// Create multiple shipping options
export async function createShippingOptions(inputs: CreateShippingOptionInput[]): Promise<Result<ShippingOptionRow[]>> {
  try {
    const { data, error } = await supabase.from('shipping_options').insert(inputs).select();

    if (error) throw error;

    return success((data || []) as ShippingOptionRow[]);
  } catch (error) {
    logError(error, 'shippingService:createShippingOptions');
    return failure(normalizeError(error));
  }
}
