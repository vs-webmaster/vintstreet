import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { corsHeaders, createSupabaseClient, authenticateUser, createErrorResponse } from '../_shared/auth.ts';

// Platform fee percentage (e.g., 10% = 0.10)
const PLATFORM_FEE_PERCENTAGE = 0.1;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createSupabaseClient();
    const user = await authenticateUser(req, supabaseClient);

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    // Parse request body
    const { orderId, sellerId, amount, currency = 'gbp' } = await req.json();

    if (!orderId || !sellerId || !amount) {
      throw new Error('Missing required fields: orderId, sellerId, amount');
    }

    // Get seller's Stripe account
    const { data: sellerAccount, error: accountError } = await supabaseClient
      .from('stripe_connected_accounts')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (accountError || !sellerAccount) {
      throw new Error("Seller hasn't connected their Stripe account yet");
    }

    if (!sellerAccount.charges_enabled) {
      throw new Error("Seller's Stripe account is not ready to receive payments");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Calculate amounts (Stripe uses smallest currency unit, e.g., pence for GBP)
    const totalAmount = Math.round(amount * 100);
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENTAGE);
    const sellerNet = totalAmount - platformFee;

    // Check if buyer has a Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Create PaymentIntent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency,
      customer: customerId,
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerAccount.stripe_account_id,
      },
      metadata: {
        order_id: orderId,
        seller_id: sellerId,
        buyer_id: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store transaction in database
    await supabaseClient.from('stripe_transactions').insert({
      order_id: orderId,
      seller_id: sellerId,
      buyer_id: user.id,
      stripe_payment_intent_id: paymentIntent.id,
      total_amount: amount,
      platform_fee: platformFee / 100,
      seller_net: sellerNet / 100,
      currency: currency,
      status: 'pending',
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('[CREATE-PAYMENT-WITH-SPLIT] Error:', error);
    return createErrorResponse(error, corsHeaders);
  }
});
