import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Get the user from the JWT
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin or super_admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (roleError || !userRole) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: attrError } = await supabaseClient
      .from('product_attribute_values')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (attrError) {
      console.error('Error deleting attributes:', attrError);
      throw attrError;
    }

    const { error: tagError } = await supabaseClient
      .from('product_tag_links')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (tagError) {
      console.error('Error deleting tag links:', tagError);
      throw tagError;
    }

    const { error: level4Error } = await supabaseClient
      .from('product_level4_categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (level4Error) {
      console.error('Error deleting level4 categories:', level4Error);
      throw level4Error;
    }

    const { error: cartError } = await supabaseClient
      .from('cart')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (cartError) {
      console.error('Error deleting cart items:', cartError);
      throw cartError;
    }

    const { error: offersError } = await supabaseClient
      .from('offers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (offersError) {
      console.error('Error deleting offers:', offersError);
      throw offersError;
    }

    // Archive all listings instead of deleting

    const { error: listingsError } = await supabaseClient
      .from('listings')
      .update({ archived: true })
      .eq('archived', false);

    if (listingsError) {
      console.error('Error archiving listings:', listingsError);
      throw listingsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All products and related data archived successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in delete-all-products function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
