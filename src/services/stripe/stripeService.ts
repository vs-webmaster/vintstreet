// Stripe Service
// Centralized data access for Stripe-related operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface StripeTransaction {
  id: string;
  order_id: string | null;
  seller_id: string;
  buyer_id: string;
  stripe_payment_intent_id: string;
  stripe_charge_id: string | null;
  total_amount: number;
  platform_fee: number;
  seller_net: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StripePayout {
  id: string;
  seller_id: string;
  stripe_payout_id: string | null;
  amount: number;
  currency: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch Stripe transactions for a seller
export async function fetchStripeTransactions(sellerId: string): Promise<Result<StripeTransaction[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('stripe_transactions')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as StripeTransaction[], error: null };
  }, 'fetchStripeTransactions');
}

// Fetch Stripe payouts for a seller
export async function fetchStripePayouts(sellerId: string): Promise<Result<StripePayout[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('stripe_payouts')
      .select('*')
      .eq('seller_id', sellerId)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as StripePayout[], error: null };
  }, 'fetchStripePayouts');
}

export interface StripeConnectedAccount {
  id: string;
  seller_id: string;
  stripe_account_id: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch Stripe connected account for a seller
export async function fetchStripeConnectedAccount(sellerId: string): Promise<Result<StripeConnectedAccount | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('stripe_connected_accounts')
      .select('*')
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return { data: (data as StripeConnectedAccount) || null, error: null };
  }, 'fetchStripeConnectedAccount');
}
