import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXCHANGE_API_KEY = Deno.env.get('EXCHANGE_RATE_API_KEY');
const BASE_CURRENCY = 'GBP';
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'CAD', 'AUD', 'JPY'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Fetch latest rates from exchangerate-api.com
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/${BASE_CURRENCY}`);

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates');
    }

    // Update rates in database
    const updates = [];
    for (const currency of SUPPORTED_CURRENCIES) {
      const rate = data.conversion_rates[currency];

      if (!rate) {
        continue;
      }

      const { error } = await supabase.from('currency_rates').upsert(
        {
          base_currency: BASE_CURRENCY,
          target_currency: currency,
          rate: rate,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'base_currency,target_currency',
          ignoreDuplicates: false,
        },
      );

      if (error) {
        console.error(`Error updating ${currency}:`, error);
      } else {
        updates.push(currency);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updates,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in fetch-exchange-rates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
