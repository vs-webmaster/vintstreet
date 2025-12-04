// Settings Service
// Centralized data access for app settings like buyer protection fees, currency rates, etc.

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';
import { success, failure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

// ==================== BUYER PROTECTION FEES ====================

export interface BuyerProtectionFee {
  id: string;
  min_price: number;
  max_price: number | null;
  percentage: number;
  created_at: string;
  updated_at: string;
}

// Fetch all buyer protection fees
export async function fetchBuyerProtectionFees(): Promise<Result<BuyerProtectionFee[]>> {
  try {
    const { data, error } = await supabase
      .from('buyer_protection_fees')
      .select('*')
      .order('min_price', { ascending: true });

    if (error) throw error;

    return success((data || []) as BuyerProtectionFee[]);
  } catch (error) {
    logError(error, 'settingsService:fetchBuyerProtectionFees');
    return failure(normalizeError(error));
  }
}

// Calculate buyer protection fee for a given price
export function calculateBuyerProtectionFee(price: number, fees: BuyerProtectionFee[]): number | null {
  if (!fees || fees.length === 0) return null;

  const matchingTier = fees.find((fee) => {
    const minMatch = price >= fee.min_price;
    const maxMatch = fee.max_price === null || price <= fee.max_price;
    return minMatch && maxMatch;
  });

  if (!matchingTier) return null;

  return (price * matchingTier.percentage) / 100;
}

// Save buyer protection fees (upsert and delete)
export async function saveBuyerProtectionFees(
  fees: Array<{ id?: string; min_price: number; max_price: number | null; percentage: number; isNew?: boolean }>,
  existingIds: string[],
): Promise<Result<boolean>> {
  try {
    // Delete removed fees
    const keptIds = fees.filter((f) => f.id && !f.isNew).map((f) => f.id!);
    const idsToDelete = existingIds.filter((id) => !keptIds.includes(id));

    if (idsToDelete.length > 0) {
      const { error } = await supabase.from('buyer_protection_fees').delete().in('id', idsToDelete);
      if (error) {
        logError(error, 'saveBuyerProtectionFees - delete');
        return failure(normalizeError(error));
      }
    }

    // Upsert fees
    for (const fee of fees) {
      const feeData = {
        min_price: fee.min_price,
        max_price: fee.max_price,
        percentage: fee.percentage,
      };

      if (fee.id && !fee.isNew) {
        const { error } = await supabase.from('buyer_protection_fees').update(feeData).eq('id', fee.id);
        if (error) {
          logError(error, 'saveBuyerProtectionFees - update');
          return failure(normalizeError(error));
        }
      } else {
        const { error } = await supabase.from('buyer_protection_fees').insert(feeData);
        if (error) {
          logError(error, 'saveBuyerProtectionFees - insert');
          return failure(normalizeError(error));
        }
      }
    }

    return success(true);
  } catch (error) {
    logError(error, 'saveBuyerProtectionFees');
    return failure(normalizeError(error));
  }
}

// ==================== CURRENCY RATES ====================

export interface CurrencyRate {
  target_currency: string;
  rate: number;
}

// Fetch currency rates
export async function fetchCurrencyRates(): Promise<Result<Record<string, number>>> {
  try {
    const { data, error } = await supabase.from('currency_rates').select('target_currency, rate');

    if (error) throw error;

    const rates: Record<string, number> = { GBP: 1 };
    (data || []).forEach((curr: unknown) => {
      const code = String(curr.target_currency).toUpperCase();
      const rateNum = Number(curr.rate);
      if (Number.isFinite(rateNum)) {
        rates[code] = rateNum;
      }
    });

    return success(rates);
  } catch (error) {
    logError(error, 'settingsService:fetchCurrencyRates');
    return failure(normalizeError(error));
  }
}

// ==================== SELLER FEES ====================

export interface SellerFee {
  id: string;
  fee_type: 'marketplace' | 'auction';
  percentage: number;
  created_at: string;
  updated_at: string;
}

// Fetch all seller fees
export async function fetchSellerFees(): Promise<Result<SellerFee[]>> {
  try {
    const { data, error } = await supabase.from('seller_fees').select('*').order('fee_type', { ascending: true });

    if (error) throw error;

    return success((data || []) as SellerFee[]);
  } catch (error) {
    logError(error, 'settingsService:fetchSellerFees');
    return failure(normalizeError(error));
  }
}

// Update seller fee
export async function updateSellerFee(
  feeType: 'marketplace' | 'auction',
  percentage: number,
): Promise<Result<SellerFee>> {
  try {
    const { data, error } = await supabase
      .from('seller_fees')
      .update({ percentage })
      .eq('fee_type', feeType)
      .select()
      .single();

    if (error) throw error;

    return success(data as SellerFee);
  } catch (error) {
    logError(error, 'settingsService:updateSellerFee');
    return failure(normalizeError(error));
  }
}

// Calculate seller fee
export function calculateSellerFee(
  price: number,
  fees: SellerFee[],
  productType: 'marketplace' | 'auction',
): number | null {
  if (!fees || fees.length === 0) return null;

  const matchingFee = fees.find((fee) => fee.fee_type === productType);
  if (!matchingFee) return null;

  return (price * matchingFee.percentage) / 100;
}

// Get seller fee percentage
export function getSellerFeePercentage(fees: SellerFee[], productType: 'marketplace' | 'auction'): number | null {
  if (!fees || fees.length === 0) return null;
  const matchingFee = fees.find((fee) => fee.fee_type === productType);
  return matchingFee?.percentage ?? null;
}

// ==================== NO PRODUCTS SETTINGS ====================

export interface NoProductsSettings {
  id: string;
  image_url: string | null;
  title: string | null;
  content: string | null;
  cta_text: string | null;
  cta_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateNoProductsSettingsInput {
  image_url?: string | null;
  title?: string | null;
  content?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
}

// Fetch no products settings
export async function fetchNoProductsSettings(): Promise<Result<NoProductsSettings | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('no_products_settings').select('*').maybeSingle();

    if (error) throw error;
    return { data: (data as NoProductsSettings) || null, error: null };
  }, 'fetchNoProductsSettings');
}

// Update no products settings
export async function updateNoProductsSettings(
  updates: UpdateNoProductsSettingsInput,
): Promise<Result<NoProductsSettings>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('no_products_settings')
      .upsert(
        {
          id: '00000000-0000-0000-0000-000000000001',
          ...updates,
        },
        {
          onConflict: 'id',
        },
      )
      .select()
      .single();

    if (error) throw error;
    return { data: data as NoProductsSettings, error: null };
  }, 'updateNoProductsSettings');
}

// ==================== SITE CONTENT ====================

export interface SiteContent {
  id: string;
  instagram_post_1?: string | null;
  instagram_post_2?: string | null;
  instagram_post_3?: string | null;
  [key: string]: unknown;
}

// Fetch site content
export async function fetchSiteContent(): Promise<Result<SiteContent>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('site_content').select('*').single();

    if (error) throw error;
    return { data: data as SiteContent, error: null };
  }, 'fetchSiteContent');
}

// ==================== PROMO MESSAGE ====================

export interface PromoMessage {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Fetch active promo message
export async function fetchPromoMessage(): Promise<Result<string | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('promo_message').select('message').eq('is_active', true).maybeSingle();

    if (error) throw error;
    return { data: data?.message || null, error: null };
  }, 'fetchPromoMessage');
}
