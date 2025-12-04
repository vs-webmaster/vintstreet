/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderData {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  order_amount: number;
  quantity: number;
  status: string;
  delivery_status: string;
  tracking_number?: string | null;
}

interface ListingData {
  id: string;
  product_name: string;
  thumbnail?: string;
  weight?: number;
  sku?: string;
  stream_id?: string;
}

interface ShippingAddress {
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface SellerProfile {
  shop_type?: string;
  shop_name?: string;
  business_name?: string;
  return_address_line1?: string;
  return_address_line2?: string;
  return_city?: string;
  return_state?: string;
  return_postal_code?: string;
  return_country?: string;
  contact_email?: string;
  contact_phone?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const { orderId, shippingAddress, shippingOptionId } = await req.json();

    if (!orderId) {
      console.error('[GENERATE-SHIPPING-LABEL] Validation failed: orderId is required');
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order data
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[GENERATE-SHIPPING-LABEL] Order not found:', { orderError });
      return new Response(JSON.stringify({ error: 'Order not found', details: orderError }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if label already generated
    const { data: existingLabel } = await supabaseClient
      .from('shipping_labels')
      .select('id, tracking_number')
      .eq('order_id', orderId)
      .single();

    if (existingLabel) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Label already generated',
          tracking_number: existingLabel.tracking_number,
          label_id: existingLabel.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch listing data
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('*')
      .eq('id', order.listing_id)
      .single();

    if (listingError || !listing) {
      console.error('[GENERATE-SHIPPING-LABEL] Listing not found:', { listingError });
      return new Response(JSON.stringify({ error: 'Listing not found', details: listingError }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use provided seller address or fetch from seller profile
    let sellerProfile: SellerProfile | null = null;
    const { data: profileData } = await supabaseClient
      .from('seller_profiles')
      .select('*')
      .eq('user_id', order.seller_id)
      .single();
    sellerProfile = profileData;

    // Determine if warehouse order
    // Check if listing stream_id is "master-catalog" OR seller is VintStreet System
    const isWarehouse = sellerProfile?.shop_type === 'master';

    let result: unknown;
    let trackingNumber: string | null = null;

    try {
      if (isWarehouse) {
        // Warehouse flow: Use Ninja API

        result = await generateNinjaLabel(order, listing, shippingAddress);

        trackingNumber = result?.tracking_code || result?.tracking_number || null;
      } else {
        // C2C flow: Use Voila API

        const { data: shippingOption, error: shippingOptionError } = await supabaseClient
          .from('shipping_options')
          .select('*, shipping_providers(name)')
          .eq('id', shippingOptionId)
          .single();

        if (shippingOptionError || !shippingOption) {
          console.error('[GENERATE-SHIPPING-LABEL] Shipping option not found:', { shippingOptionError });
          return new Response(JSON.stringify({ error: 'Shipping option not found', details: shippingOptionError }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        result = await generateVoilaLabel(order, listing, shippingAddress, sellerProfile, shippingOption);

        trackingNumber = result?.tracking_codes?.[0] || null;
        // Check if tracking number was generated
        if (!trackingNumber) {
          throw new Error('Label generation succeeded but no tracking number was returned');
        }
      }
    } catch (labelError) {
      console.error('[GENERATE-SHIPPING-LABEL] Label generation failed:', {
        error: labelError instanceof Error ? labelError.message : String(labelError),
        order_id: orderId,
      });

      // Delete the order from Supabase table

      const { error: deleteError } = await supabaseClient.from('orders').delete().eq('id', orderId);

      if (deleteError) {
        console.error('[GENERATE-SHIPPING-LABEL] Failed to delete order:', {
          orderId,
          error: deleteError,
        });
      } else {
        // Success - no action needed
      }

      // Re-throw the error to be caught by outer catch block
      throw labelError;
    }

    // Save label data to database
    if (trackingNumber) {
      const { error: insertError } = await supabaseClient.from('shipping_labels').insert({
        order_id: orderId,
        tracking_number: trackingNumber,
        label_type: isWarehouse ? 'ninja' : 'voila',
        label_data: result,
        generated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('[GENERATE-SHIPPING-LABEL] Failed to save label to database:', {
          orderId,
          error: insertError,
        });
        // If label save fails, delete the order
        await supabaseClient.from('orders').delete().eq('id', orderId);
        throw new Error(`Failed to save label to database: ${insertError.message}`);
      }

      // Update order with tracking number

      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ tracking_number: trackingNumber })
        .eq('id', orderId);

      if (updateError) {
        console.error('[GENERATE-SHIPPING-LABEL] Failed to update order with tracking number:', {
          orderId,
          error: updateError,
        });
        // If update fails, delete the order
        await supabaseClient.from('orders').delete().eq('id', orderId);
        throw new Error(`Failed to update order with tracking number: ${updateError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        tracking_number: trackingNumber,
        label_type: isWarehouse ? 'ninja' : 'voila',
        data: result,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[GENERATE-SHIPPING-LABEL] Error generating shipping label:', { error });
    return new Response(
      JSON.stringify({
        error: '[GENERATE-SHIPPING-LABEL] Failed to generate shipping label',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

/**
 * Generate label via Ninja (MoovParcel) API for warehouse orders
 */
async function generateNinjaLabel(
  order: OrderData,
  listing: ListingData,
  shippingAddress: ShippingAddress | null,
): Promise<unknown> {
  const NINJA_EMAIL = Deno.env.get('NINJA_EMAIL') || '';
  const NINJA_PASSWORD = Deno.env.get('NINJA_PASSWORD') || '';

  // Authenticate
  const loginResponse = await fetch('https://api.moovparcel.net/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'VintStreet/1.0',
      Accept: 'application/json',
      Authorization: new Date().getTime().toString(),
    },
    body: JSON.stringify({
      email: NINJA_EMAIL,
      password: NINJA_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    console.error('[GENERATE-SHIPPING-LABEL] Ninja authentication failed');
    throw new Error(`Ninja authentication failed: ${loginResponse.status}`);
  }

  const loginData = await loginResponse.json();
  const accessToken = loginData.accessToken;

  if (!accessToken) {
    console.error('[GENERATE-SHIPPING-LABEL] Ninja API response missing access token:');
    throw new Error('Ninja API response missing access token');
  }

  // Prepare order number and primary reference ID to meet Ninja API requirements (max 30 chars)
  // Extract alphanumeric characters from order ID, take last 8, and format them
  const orderId = order.id.replace(/-/g, '').toUpperCase();
  const orderNumber = `ORD-${orderId}`.substring(0, 30);
  const primaryReferenceId = `#${orderId}`.substring(0, 30);

  const orderData = [
    {
      order_id: orderNumber,
      channel_id: '',
      channel_alt_id: '',
      channel_name: 'VintStreet',
      channel_type: 'API',
      store_id: '',
      remote_id: orderNumber,
      remote_status: '',
      status: '',
      customer: {
        id: null,
        customer_uuid: null,
        company_id: null,
        name: `${shippingAddress?.first_name || ''} ${shippingAddress?.last_name || ''}`.trim(),
        email: shippingAddress?.email || '',
        created_at: new Date().toISOString(),
        updated_at: '',
      },
      shipping_method: 'Standard',
      shipping_address: {
        id: '',
        name: `${shippingAddress?.first_name || ''} ${shippingAddress?.last_name || ''}`.trim(),
        company_name: null,
        address_line_one: shippingAddress?.address_line1 || '',
        address_line_two: shippingAddress?.address_line2 || '',
        address_line_three: '',
        county: shippingAddress?.state || '',
        city: shippingAddress?.city || '',
        country_iso_code: shippingAddress?.country || 'GB',
        zip: shippingAddress?.postal_code || '',
        phone: shippingAddress?.phone || '',
      },
      invoice_address: {
        id: '',
        name: `${shippingAddress?.first_name || ''} ${shippingAddress?.last_name || ''}`.trim(),
        company_name: null,
        address_line_one: shippingAddress?.address_line1 || '',
        address_line_two: shippingAddress?.address_line2 || '',
        address_line_three: '',
        county: shippingAddress?.state || '',
        city: shippingAddress?.city || '',
        country_iso_code: shippingAddress?.country || 'GB',
        zip: shippingAddress?.postal_code || '',
        phone: shippingAddress?.phone || '',
      },
      fulfillment: null,
      return: null,
      payment_method: 'manual',
      send_via_webhook: false,
      payment_details: {
        vat_id: null,
        vat_type: null,
        tax_total: '0.0000',
        shipping_total: '0.0000',
        discount_total: '0.0000',
        discount_total_exc_tax: '0.0000',
        order_subtotal: order.order_amount.toFixed(4),
        order_subtotal_exc_tax: order.order_amount.toFixed(4),
        order_total: order.order_amount.toFixed(4),
        payment_method: 'manual',
        payment_ref: null,
        payment_currency: 'GBP',
        coupon_code: '',
        coupon_total: '0.0000',
        coupon_total_exc_tax: '0.0000',
      },
      system_notes: null,
      delivery_notes: null,
      customer_comments: null,
      gift_note: '',
      channel_specific: {
        tags: ['JSON'],
        order_number: orderNumber,
        total_weight: listing.weight || 200,
        shipping_code: '',
      },
      order_date: new Date().toISOString(),
      order_import_date: '',
      md5_hash: '',
      total_order_item_quantity: order.quantity,
      total_order_item_quantity_inc_kits: null,
      primary_reference_id: primaryReferenceId,
      order_lines: [
        {
          sku: listing.sku || '',
          quantity: order.quantity,
          name: listing.product_name || '',
          unit_price: order.order_amount / order.quantity,
          total_price: order.order_amount,
        },
      ],
      order_access_url: '',
    },
  ];

  // Import order to Ninja
  const importResponse = await fetch('https://api.moovparcel.net/api/orders/import-json', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!importResponse.ok) {
    console.error('[GENERATE-SHIPPING-LABEL] Ninja order import failed:', {
      importResponse: await importResponse.json(),
    });
    const errorText = await importResponse.text();
    throw new Error(`Ninja order import failed: ${importResponse.status} - ${errorText}`);
  }

  // Read response body only once
  const importResult = await importResponse.json();

  return importResult;
}

/**
 * Generate label via Voila API for C2C orders
 */
async function generateVoilaLabel(
  order: OrderData,
  listing: ListingData,
  shippingAddress: ShippingAddress | null,
  sellerProfile: SellerProfile | null,
  shippingOption: unknown,
): Promise<any> {
  const VOILA_API_USER = Deno.env.get('VOILA_API_USER') || '';
  const VOILA_API_TOKEN = Deno.env.get('VOILA_API_TOKEN') || '';

  // Extract courier name from shipping option
  const courierName = shippingOption?.shipping_providers?.name || 'DPD';

  // Map courier name to service ID
  // This mapping can be extended or moved to database if needed
  const serviceMapping: Record<string, string> = {
    DPD: 'DPD-12DROPQR', // Standard DPD service
    Yodel: 'YOD-C2CPS', // Yodel C2C service
    Evri: 'DPD-12DROPQR', // Default for Evri (may need specific service ID)
  };

  const serviceId = serviceMapping[courierName.toUpperCase()] || 'DPD-12DROPQR';

  // Calculate weight and dimensions
  const weight = listing.weight || 3;
  const dimensions = getDimensionsFromWeight(weight);

  // Generate request ID using order ID
  // Extract alphanumeric characters from order ID and use as request ID
  const orderId = order.id.replace(/-/g, '').toUpperCase();
  const requestId = `ORD-${orderId}`.substring(0, 30);

  // Prepare shipment data
  const shipmentData = {
    auth_company: 'Vintstreet',
    format_address_default: true,
    request_id: requestId,
    shipment: {
      label_size: '6x4',
      label_format: 'pdf',
      generate_invoice: false,
      generate_packing_slip: false,
      courier: {
        auth_company: 'C2C',
        courier: courierName,
        service_id: serviceId,
      },
      collection_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
      dc_service_id: serviceId,
      reference: order.id,
      reference_2: '',
      delivery_instructions: '',
      ship_from: {
        name: sellerProfile?.business_name || sellerProfile?.shop_name || 'Vint Street',
        phone: sellerProfile?.contact_phone || '',
        email: sellerProfile?.contact_email || '',
        company_name: sellerProfile?.business_name || sellerProfile?.shop_name || '',
        address_1: sellerProfile?.return_address_line1 || '',
        address_2: sellerProfile?.return_address_line2 || '',
        address_3: '',
        city: sellerProfile?.return_city || '',
        postcode: sellerProfile?.return_postal_code || '',
        county: sellerProfile?.return_state || '',
        country_iso: sellerProfile?.return_country || 'GB',
        company_id: null,
        tax_id: null,
        ioss_number: null,
      },
      ship_to: {
        name: `${shippingAddress?.first_name || ''} ${shippingAddress?.last_name || ''}`.trim(),
        phone: shippingAddress?.phone || '',
        email: shippingAddress?.email || '',
        company_name: null,
        address_1: shippingAddress?.address_line1 || '',
        address_2: shippingAddress?.address_line2 || '',
        address_3: '',
        city: shippingAddress?.city || '',
        county: shippingAddress?.state || '',
        postcode: shippingAddress?.postal_code || '',
        country_iso: shippingAddress?.country || 'GB',
        tax_id: null,
      },
      parcels: [
        {
          dim_width: dimensions.width,
          dim_height: dimensions.height,
          dim_length: dimensions.length,
          dim_unit: 'cm',
          items: [
            {
              description: listing.product_name || '',
              origin_country: 'GB',
              quantity: order.quantity,
              value_currency: 'GBP',
              weight: weight,
              weight_unit: 'KG',
              sku: listing.sku || '',
              hs_code: '50000000',
              value: order.order_amount.toFixed(2),
              extended_description: listing.product_name || '',
            },
          ],
        },
      ],
    },
  };

  // Create label via Voila API
  const response = await fetch('https://production.courierapi.co.uk/api/couriers/v1/MoovParcel/create-label', {
    method: 'POST',
    headers: {
      'api-user': VOILA_API_USER,
      'api-token': VOILA_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shipmentData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voila API label creation failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.tracking_codes || result.tracking_codes.length === 0) {
    throw new Error('Voila API response missing tracking codes');
  }

  return result;
}

/**
 * Get dimensions based on weight
 */
function getDimensionsFromWeight(weight: number): { length: number; width: number; height: number } {
  if (weight < 1) {
    return { length: 37, width: 23, height: 10 };
  }
  if (weight < 2) {
    return { length: 47, width: 34, height: 15 };
  }
  if (weight < 30) {
    return { length: 50, width: 38, height: 19 };
  }
  return { length: 100, width: 100, height: 100 };
}
