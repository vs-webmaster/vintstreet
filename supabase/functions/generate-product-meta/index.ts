import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productTitle, productDescription, productExcerpt, attributes } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build context for AI
    let context = `Product Title: ${productTitle}\n`;

    if (productDescription && productDescription.trim()) {
      context += `Product Description: ${productDescription}\n`;
    } else {
      if (productExcerpt) {
        context += `Product Excerpt: ${productExcerpt}\n`;
      }
      if (attributes && Object.keys(attributes).length > 0) {
        context += `Product Attributes: ${JSON.stringify(attributes)}\n`;
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an SEO expert. Generate compelling meta titles (max 60 characters) and meta descriptions (max 160 characters) for products. Return ONLY a JSON object with "metaTitle" and "metaDescription" fields, no other text.',
          },
          {
            role: 'user',
            content: `Generate an SEO-optimized meta title and meta description for this product:\n\n${context}`,
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parse the JSON response
    const metaData = JSON.parse(generatedText.trim());

    return new Response(JSON.stringify(metaData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-product-meta function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
