import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoryName, categoryLevel = 1 } = await req.json();

    if (!categoryName) {
      return new Response(JSON.stringify({ error: 'Category name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a fashion/retail category expert. Given a category name, generate a comprehensive list of synonyms and alternative terms that shoppers might search for.

Rules:
- Generate 5-15 synonyms depending on how broad the category is
- Include both singular and plural forms where appropriate
- Include common misspellings (e.g., "jeens" for "jeans", "sneeker" for "sneaker")
- Include regional variations (UK vs US terms like "trainers" vs "sneakers", "jumper" vs "sweater")
- Include colloquial terms (e.g., "kicks" for sneakers)
- Include related terms and subcategories
- Keep all terms lowercase
- Don't repeat the original category name more than once
- For clothing items, consider fabric types, styles, and occasions

Examples:
Category: "Trainers" → ["trainers", "sneakers", "sneeker", "sneeker", "kicks", "athletic shoes", "running shoes", "sports shoes", "gym shoes", "runners"]
Category: "Jumper" → ["jumper", "sweater", "pullover", "knitwear", "knit", "knitted top", "crew neck"]
Category: "Jeans" → ["jeans", "jeens", "denim", "denims", "denim pants", "blue jeans"]
Category: "T-Shirt" → ["t-shirt", "tshirt", "tee", "tee shirt", "top", "shirt"]`,
          },
          {
            role: 'user',
            content: `Generate synonyms for this category: "${categoryName}"`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_synonyms',
              description: 'Generate synonyms for a fashion/retail category',
              parameters: {
                type: 'object',
                properties: {
                  synonyms: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of synonym strings, all lowercase',
                  },
                },
                required: ['synonyms'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_synonyms' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract synonyms from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const synonyms = JSON.parse(toolCall.function.arguments).synonyms;

    // Ensure all synonyms are lowercase and deduplicated
    const cleanedSynonyms = [...new Set(synonyms.map((s: string) => s.toLowerCase().trim()))];

    return new Response(JSON.stringify({ synonyms: cleanedSynonyms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-category-synonyms:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
