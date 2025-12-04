import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationResult {
  isApproved: boolean;
  requiresReview: boolean;
  categories: Array<{
    class: string;
    score: number;
  }>;
  message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HIVE_API_KEY = Deno.env.get('HIVE_API_KEY');
    if (!HIVE_API_KEY) {
      throw new Error('HIVE_API_KEY not configured');
    }

    const { type, content } = await req.json();

    if (!type || !content) {
      throw new Error('Missing required fields: type and content');
    }

    const formData = new FormData();

    if (type === 'text') {
      formData.append('text_data', content);
    } else if (type === 'image') {
      // For images, content should be a URL or base64
      if (content.startsWith('http')) {
        formData.append('url', content);
      } else {
        // Convert base64 to blob
        const base64Data = content.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const blob = new Blob([binaryData], { type: 'image/jpeg' });
        formData.append('media', blob, 'image.jpg');
      }
    }

    const response = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: {
        Authorization: `Token ${HIVE_API_KEY}`,
        accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HIVE API error:', response.status, errorText);
      throw new Error(`HIVE API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse the response
    const moderationResult: ModerationResult = {
      isApproved: true,
      requiresReview: false,
      categories: [],
    };

    if (data.status && data.status[0] && data.status[0].response) {
      const output = data.status[0].response.output;

      if (output && output[0] && output[0].classes) {
        const classes = output[0].classes;

        // Define thresholds
        const REJECT_THRESHOLD = 0.9;
        const REVIEW_THRESHOLD = 0.7;

        // Categories to check
        const restrictedCategories = [
          'general_nsfw',
          'general_suggestive',
          'yes_sexual_activity',
          'yes_male_nudity',
          'yes_female_nudity',
          'yes_underage',
          'yes_violent',
          'yes_graphic_violence',
          'yes_self_harm',
          'yes_hate_symbols',
          'very_bloody',
          'weapon_in_hand',
          'gun_in_hand',
        ];

        const flaggedCategories = classes
          .filter((c: unknown) => restrictedCategories.includes(c.class) && c.score > REVIEW_THRESHOLD)
          .map((c: unknown) => ({ class: c.class, score: c.score }));

        moderationResult.categories = flaggedCategories;

        // Check if any category exceeds reject threshold
        const shouldReject = flaggedCategories.some((c: unknown) => c.score >= REJECT_THRESHOLD);
        const shouldReview = flaggedCategories.some(
          (c: unknown) => c.score >= REVIEW_THRESHOLD && c.score < REJECT_THRESHOLD,
        );

        if (shouldReject) {
          moderationResult.isApproved = false;
          moderationResult.requiresReview = false;
          moderationResult.message = `Content violates community guidelines. Flagged categories: ${flaggedCategories.map((c: unknown) => c.class).join(', ')}`;
        } else if (shouldReview) {
          moderationResult.isApproved = true;
          moderationResult.requiresReview = true;
          moderationResult.message = `Content flagged for manual review. Categories: ${flaggedCategories.map((c: unknown) => c.class).join(', ')}`;
        }
      }
    }

    return new Response(JSON.stringify(moderationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in moderate-content function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        isApproved: true,
        requiresReview: false,
        categories: [],
        message: 'Moderation check failed, content approved by default',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
