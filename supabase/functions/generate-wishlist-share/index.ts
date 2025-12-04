import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's JWT token for RLS
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const { name } = await req.json();

    // Check if user already has an active shared wishlist
    const { data: existingShare } = await supabaseClient
      .from('shared_wishlists')
      .select('id, share_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (existingShare) {
      return new Response(
        JSON.stringify({
          shareToken: existingShare.share_token,
          url: `${req.headers.get('origin')}/shared-wishlist/${existingShare.share_token}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Generate unique share token (base62 for URL-friendly)
    const shareToken = generateShareToken();

    // Create new shared wishlist
    const { data: sharedWishlist, error } = await supabaseClient
      .from('shared_wishlists')
      .insert({
        user_id: user.id,
        share_token: shareToken,
        name: name || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shared wishlist:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        shareToken: sharedWishlist.share_token,
        url: `${req.headers.get('origin')}/shared-wishlist/${sharedWishlist.share_token}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in generate-wishlist-share:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
