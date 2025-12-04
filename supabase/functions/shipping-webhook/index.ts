import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Webhook handler for Ninja (MoovParcel) API
 * Receives label generation updates and order status changes
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const webhookData = await req.json();

    // Extract order ID from webhook data
    // Ninja webhook format may vary - adjust based on actual webhook structure
    const orderId = webhookData.order_id || webhookData.remote_id || webhookData.reference;
    const trackingNumber = webhookData.tracking_code || webhookData.tracking_number || webhookData.tracking_codes?.[0];
    const labelUri = webhookData.label_uri || webhookData.uri || webhookData.label_url;
    const labelBase64 = webhookData.label_base64 || webhookData.label;
    const status = webhookData.status || webhookData.order_status;

    if (!orderId) {
      console.error('Webhook missing order identifier');
      return new Response(JSON.stringify({ error: 'Missing order identifier' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find order by ID (could be UUID or order number)
    let order;
    const { data: orderByUuid } = await supabaseClient
      .from('orders')
      .select('id, tracking_number')
      .eq('id', orderId)
      .single();

    if (orderByUuid) {
      order = orderByUuid;
    } else {
      // Try finding by order number if it's a formatted number
      const orderNumber = orderId.replace(/^#/, '').replace(/^ORD-/, '');
      const { data: orders } = await supabaseClient
        .from('orders')
        .select('id, tracking_number')
        .ilike('id', `%${orderNumber}%`)
        .limit(1);

      if (orders && orders.length > 0) {
        order = orders[0];
      }
    }

    if (!order) {
      console.error('Order not found for webhook:', orderId);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update or create shipping label record
    const labelData: unknown = {
      order_id: order.id,
      label_type: 'ninja',
      label_data: webhookData,
      updated_at: new Date().toISOString(),
    };

    if (trackingNumber) {
      labelData.tracking_number = trackingNumber;
    }

    if (labelUri) {
      labelData.label_uri = labelUri;
    }

    if (labelBase64) {
      labelData.label_base64 = labelBase64;
    }

    // Check if label already exists
    const { data: existingLabel } = await supabaseClient
      .from('shipping_labels')
      .select('id')
      .eq('order_id', order.id)
      .single();

    if (existingLabel) {
      // Update existing label
      await supabaseClient.from('shipping_labels').update(labelData).eq('id', existingLabel.id);
    } else {
      // Create new label record
      labelData.generated_at = new Date().toISOString();
      await supabaseClient.from('shipping_labels').insert(labelData);
    }

    // Update order with tracking number if provided
    if (trackingNumber && trackingNumber !== order.tracking_number) {
      await supabaseClient.from('orders').update({ tracking_number: trackingNumber }).eq('id', order.id);
    }

    // Update order status if provided
    if (status) {
      let deliveryStatus = 'processing';
      if (status.toLowerCase().includes('shipped') || status.toLowerCase().includes('dispatched')) {
        deliveryStatus = 'shipped';
      } else if (status.toLowerCase().includes('delivered')) {
        deliveryStatus = 'delivered';
      } else if (status.toLowerCase().includes('cancelled') || status.toLowerCase().includes('canceled')) {
        deliveryStatus = 'cancelled';
      }

      await supabaseClient.from('orders').update({ delivery_status: deliveryStatus }).eq('id', order.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        order_id: order.id,
        tracking_number: trackingNumber,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error processing shipping webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
