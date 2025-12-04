import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform fee percentage (e.g., 10% = 0.10)
const PLATFORM_FEE_PERCENTAGE = 0.1;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  let orderIds: string[] = [];

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { orders, shippingCost, platform } = await req.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      throw new Error('Missing or invalid orders array');
    }

    // Extract order IDs for cleanup in case of error
    orderIds = orders.map((o: any) => o.id).filter((id: string) => id);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Check if buyer has a Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Group orders by seller
    const ordersBySeller: Record<string, typeof orders> = {};
    for (const order of orders) {
      if (!ordersBySeller[order.seller_id]) {
        ordersBySeller[order.seller_id] = [];
      }
      ordersBySeller[order.seller_id].push(order);
    }

    const lineItems: any[] = [];

    // For multiple sellers, we'll create separate checkout sessions
    // For now, we'll create a single checkout with line items from all sellers
    // and handle split in webhook or use Connect

    for (const order of orders) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: order.product_name,
            description: `Sold by ${order.seller_name || 'Seller'}`,
          },
          unit_amount: Math.round(order.price * 100), // Convert to pence
        },
        quantity: order.quantity || 1,
      });
    }

    // Add shipping as a line item
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get('origin') || 'http://localhost:8080';
    const isMobile = platform === 'mobile';
    // Build dynamic cancel URL
    const sellerId = orders[0]?.seller_id || '';
    const productIds = orders.map((o) => o.product_id).join(',');
    const successUrl = isMobile
      ? 'vintstreetapp://payment-success?session_id={CHECKOUT_SESSION_ID}'
      : `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = isMobile
      ? `vintstreetapp://checkout?sellerId=${sellerId}&productIds=${productIds}`
      : `${origin}/checkout`;

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        buyer_id: user.id,
        order_ids: orders.map((o: any) => o.id).join(','),
      },
    });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('[CREATE-CHECKOUT-SPLIT] Error:', error);

    // Delete order records if they were created
    if (orderIds.length > 0) {
      try {
        const { error: deleteError } = await supabaseClient.from('orders').delete().in('id', orderIds);

        if (deleteError) {
          console.error('[CREATE-CHECKOUT-SPLIT] Error deleting orders:', deleteError);
        } else {
        }
      } catch (cleanupError) {
        console.error('[CREATE-CHECKOUT-SPLIT] Error during cleanup:', cleanupError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
