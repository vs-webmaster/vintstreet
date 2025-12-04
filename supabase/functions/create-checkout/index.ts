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

  const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');

  try {
    // Retrieve authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated or email not available');
    }

    // Get request body
    const { productId, quantity = 1, shippingAddress, shippingCost = 0, shippingOptionId } = await req.json();

    if (!productId) {
      throw new Error('Product ID is required');
    }

    if (!shippingAddress) {
      throw new Error('Shipping address is required');
    }

    // Fetch product details from database
    const { data: product, error: productError } = await supabaseClient
      .from('listings')
      .select('id, product_name, discounted_price, starting_price, thumbnail, seller_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    const price = product.discounted_price || product.starting_price;

    if (!price || price <= 0) {
      throw new Error('Invalid product price');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Build line items array with product and shipping
    const lineItems = [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: product.product_name,
            images: product.thumbnail ? [product.thumbnail] : undefined,
            metadata: {
              product_id: product.id,
              seller_id: product.seller_id,
            },
          },
          unit_amount: Math.round(price * 100), // Convert to pence
        },
        quantity: quantity,
      },
    ];

    // Add shipping as a separate line item if there's a cost
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
            images: undefined,
            metadata: {
              product_id: product.id,
              seller_id: product.seller_id,
            },
          },
          unit_amount: Math.round(shippingCost * 100), // Convert to pence
        },
        quantity: 1,
      });
    }

    // Create a one-time payment session using price_data for dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/product/${productId}`,
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA', 'AU', 'NZ', 'IE'],
      },
      metadata: {
        product_id: product.id,
        seller_id: product.seller_id,
        buyer_id: user.id,
        quantity: quantity.toString(),
        shipping_cost: shippingCost.toString(),
        shipping_option_id: shippingOptionId || '',
        shipping_first_name: shippingAddress.first_name,
        shipping_last_name: shippingAddress.last_name,
        shipping_address_line1: shippingAddress.address_line1,
        shipping_address_line2: shippingAddress.address_line2 || '',
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state || '',
        shipping_postal_code: shippingAddress.postal_code,
        shipping_country: shippingAddress.country,
        shipping_phone: shippingAddress.phone || '',
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
