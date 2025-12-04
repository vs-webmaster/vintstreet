import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Get webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    // Get raw body for signature verification
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    // Verify webhook signature if secret is set
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('[STRIPE-WEBHOOK] Signature verification failed:', err);
        return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    } else {
      event = JSON.parse(body);
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update transaction status
        const { error } = await supabaseClient
          .from('stripe_transactions')
          .update({
            status: 'succeeded',
            stripe_charge_id: paymentIntent.latest_charge as string,
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('[STRIPE-WEBHOOK] Error updating transaction:', error);
        } else {
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update transaction status
        await supabaseClient
          .from('stripe_transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        // Update connected account status
        await supabaseClient
          .from('stripe_connected_accounts')
          .update({
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            onboarding_complete: account.details_submitted && account.charges_enabled,
          })
          .eq('stripe_account_id', account.id);

        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;

        // Update payout status
        await supabaseClient
          .from('stripe_payouts')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('stripe_payout_id', payout.id);

        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;

        // Update payout status
        await supabaseClient
          .from('stripe_payouts')
          .update({
            status: 'failed',
            failure_reason: payout.failure_message || 'Unknown error',
          })
          .eq('stripe_payout_id', payout.id);

        break;
      }

      default:
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
