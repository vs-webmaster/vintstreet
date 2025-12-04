import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STORAGE_BUCKET = 'product-images';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId } = await req.json();

    if (!listingId) {
      return new Response(JSON.stringify({ error: 'listingId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get listing to retrieve seller_id
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('seller_id, product_image')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return new Response(JSON.stringify({ error: 'Failed to fetch listing', details: listingError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download the original image
    const response = await fetch(listing.product_image);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to download image: ${response.status} ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const input = new Uint8Array(arrayBuffer);

    // Resize the image to width 300 (height is auto to maintain aspect ratio)
    let output: Uint8Array;
    let contentType: string = 'image/jpeg';
    let extension: string = 'jpg';

    try {
      // Decode the image using ImageScript
      const image = await Image.decode(input);

      // Calculate new height maintaining aspect ratio
      const aspectRatio = image.height / image.width;
      const newWidth = 300;
      const newHeight = Math.round(newWidth * aspectRatio);

      // Resize the image
      image.resize(newWidth, newHeight);

      // Determine output format based on original content type
      const originalContentType = response.headers.get('content-type') || '';
      const isPng = originalContentType.includes('png');
      const isWebP = originalContentType.includes('webp');

      if (isPng) {
        // Encode as PNG (preserves transparency)
        output = await image.encode(1); // 1 = PNG format
        contentType = 'image/png';
        extension = 'png';
      } else if (isWebP) {
        // Encode as WebP
        output = await image.encode(3); // 3 = WebP format
        contentType = 'image/webp';
        extension = 'webp';
      } else {
        // Default to JPEG
        output = await image.encode(); // Default is JPEG
        contentType = 'image/jpeg';
        extension = 'jpg';
      }
    } catch (resizeError) {
      console.error('ImageScript resize error:', resizeError);
      return new Response(
        JSON.stringify({
          error: 'Failed to resize image',
          details: resizeError instanceof Error ? resizeError.message : String(resizeError),
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const fileName = `${listing.seller_id}/${listingId}_thumbnail.${extension}`;

    // Upload resized image to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, output, {
      contentType: contentType,
      upsert: true, // Overwrite if file exists
    });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload resized image', details: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get public URL of the resized image
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

    // Update the listing with the resized URL in the thumbnail field
    const { error: updateError } = await supabase.from('listings').update({ thumbnail: publicUrl }).eq('id', listingId);

    if (updateError) {
      console.error('Error updating listing thumbnail:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update listing thumbnail', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        resizedUrl: publicUrl,
        message: 'Image resized and uploaded successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in generate-thumbnail:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
