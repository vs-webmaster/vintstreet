import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { corsHeaders, createSupabaseClient, authenticateUser, createErrorResponse } from '../_shared/auth.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createSupabaseClient();
    const user = await authenticateUser(req, supabaseClient);

    // Parse request body
    const { amount, currency = 'gbp' } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error('Invalid payout amount');
    }

    // Get seller's Stripe account
    const { data: sellerAccount, error: accountError } = await supabaseClient
      .from('stripe_connected_accounts')
      .select('*')
      .eq('seller_id', user.id)
      .single();

    if (accountError || !sellerAccount) {
      throw new Error('No Stripe account found');
    }

    if (!sellerAccount.payouts_enabled) {
      throw new Error('Payouts are not enabled for your account. Please complete onboarding.');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Check available balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: sellerAccount.stripe_account_id,
    });

    const availableAmount = balance.available.reduce(
      (sum: number, b: unknown) => (b.currency === currency ? sum + b.amount : sum),
      0,
    );

    const requestedAmount = Math.round(amount * 100); // Convert to smallest unit

    if (availableAmount < requestedAmount) {
      throw new Error(`Insufficient balance. Available: ${availableAmount / 100} ${currency.toUpperCase()}`);
    }

    // Create payout
    const payout = await stripe.payouts.create(
      {
        amount: requestedAmount,
        currency: currency,
      },
      {
        stripeAccount: sellerAccount.stripe_account_id,
      },
    );

    // Store payout record in database
    const { data: payoutRecord, error: insertError } = await supabaseClient
      .from('stripe_payouts')
      .insert({
        seller_id: user.id,
        stripe_payout_id: payout.id,
        amount: amount,
        currency: currency,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[CREATE-PAYOUT] Error storing payout:', insertError);
      throw new Error('Failed to store payout record');
    }

    return new Response(
      JSON.stringify({
        success: true,
        payoutId: payout.id,
        amount: amount,
        currency: currency,
        status: payout.status,
        arrival_date: payout.arrival_date,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('[CREATE-PAYOUT] Error:', error);
    return createErrorResponse(error, corsHeaders);
  }
});
