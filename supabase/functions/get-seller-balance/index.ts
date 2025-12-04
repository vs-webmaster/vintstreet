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

    // Get seller's Stripe account
    const { data: sellerAccount, error: accountError } = await supabaseClient
      .from('stripe_connected_accounts')
      .select('*')
      .eq('seller_id', user.id)
      .single();

    if (accountError || !sellerAccount) {
      throw new Error('No Stripe account found');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Get balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: sellerAccount.stripe_account_id,
    });

    // Calculate available balance (convert from smallest unit)
    const availableBalance = balance.available.reduce((sum: number, b: any) => sum + b.amount, 0) / 100;
    const pendingBalance = balance.pending.reduce((sum: number, b: any) => sum + b.amount, 0) / 100;

    // Get total earnings from transactions
    const { data: transactions } = await supabaseClient
      .from('stripe_transactions')
      .select('seller_net, status')
      .eq('seller_id', user.id);

    const totalEarnings =
      transactions?.reduce((sum, t) => {
        if (t.status === 'succeeded') {
          return sum + parseFloat(t.seller_net);
        }
        return sum;
      }, 0) || 0;

    return new Response(
      JSON.stringify({
        available: availableBalance,
        pending: pendingBalance,
        totalEarnings: totalEarnings,
        currency: balance.available[0]?.currency || 'gbp',
        accountStatus: {
          charges_enabled: sellerAccount.charges_enabled,
          payouts_enabled: sellerAccount.payouts_enabled,
          onboarding_complete: sellerAccount.onboarding_complete,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('[GET-SELLER-BALANCE] Error:', error);
    return createErrorResponse(error, corsHeaders);
  }
});
