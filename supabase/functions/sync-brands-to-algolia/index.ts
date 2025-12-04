// Supabase Edge Function to sync brands to Algolia
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALGOLIA_APP_ID = Deno.env.get('ALGOLIA_APP_ID') || '';
const ALGOLIA_ADMIN_API_KEY = Deno.env.get('ALGOLIA_ADMIN_API_KEY') || '';
const ALGOLIA_BRANDS_INDEX_NAME = Deno.env.get('ALGOLIA_BRANDS_INDEX_NAME') || 'brands';
const ALGOLIA_BASE_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_BRANDS_INDEX_NAME}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Brand {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean | null;
  is_popular?: boolean | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { brandIds, action } = await req.json();

    // Helper function to call Algolia API using native fetch
    const algoliaRequest = async (method: string, endpoint: string, body?: unknown) => {
      const url = `${ALGOLIA_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method,
        headers: {
          'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          'X-Algolia-API-Key': ALGOLIA_ADMIN_API_KEY,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Algolia API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    };

    // Handle different actions
    if (action === 'delete' && brandIds && Array.isArray(brandIds)) {
      // Delete brands from Algolia using batch delete
      await algoliaRequest('POST', '/batch', {
        requests: brandIds.map((id) => ({
          action: 'deleteObject',
          body: { objectID: id },
        })),
      });
      return new Response(
        JSON.stringify({ success: true, message: `Deleted ${brandIds.length} brands from Algolia` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch brands from database
    let query = supabase
      .from('brands')
      .select(
        `
        id,
        name,
        description,
        logo_url,
        is_active,
        is_popular
      `,
      )
      .eq('is_active', true);

    // If specific brand IDs provided, filter by them
    if (brandIds && Array.isArray(brandIds) && brandIds.length > 0) {
      query = query.in('id', brandIds);
    }

    const { data: brands, error } = await query;

    if (error) {
      throw error;
    }

    if (!brands || brands.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No brands to sync', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform brands for Algolia
    const algoliaBrands = brands.map((brand: Brand) => ({
      objectID: brand.id,
      name: brand.name,
      description: brand.description || null,
      logo_url: brand.logo_url || null,
      is_active: brand.is_active ?? true,
      is_popular: brand.is_popular ?? false,
      _tags: [
        brand.is_active ? 'active' : 'inactive',
        ...(brand.is_popular ? ['popular'] : []),
        `brand:${brand.name.toLowerCase()}`,
      ],
    }));

    // Save to Algolia using batch operation via REST API
    const batchResponse = await algoliaRequest('POST', '/batch', {
      requests: algoliaBrands.map((brand) => ({
        action: 'updateObject',
        body: brand,
      })),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${algoliaBrands.length} brands to Algolia`,
        count: algoliaBrands.length,
        taskIDs: batchResponse.taskIDs || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    console.error('Error syncing brands to Algolia:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
