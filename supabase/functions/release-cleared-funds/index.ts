import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    // Call the database function to release cleared funds
    const { error: releaseError } = await supabaseClient.rpc('release_cleared_funds');

    if (releaseError) {
      console.error('[RELEASE-CLEARED-FUNDS] Error releasing funds:', releaseError);
      throw releaseError;
    }

    // Get updated count of released funds
    const { data: releasedOrders, error: countError } = await supabaseClient
      .from('orders')
      .select('id, order_amount, seller_id')
      .eq('payout_status', 'available')
      .eq('funds_released', true);

    if (countError) {
      console.error('[RELEASE-CLEARED-FUNDS] Error fetching released orders:', countError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        releasedCount: releasedOrders?.length || 0,
        message: 'Funds release process completed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('[RELEASE-CLEARED-FUNDS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
