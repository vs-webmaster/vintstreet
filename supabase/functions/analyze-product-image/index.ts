import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryHierarchy {
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  subSubcategoryId: string | null;
  subSubcategoryName: string | null;
  subSubSubcategoryId: string | null;
  subSubSubcategoryName: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch category tree from database
    const [categoriesResult, subcategoriesResult, subSubcategoriesResult, subSubSubcategoriesResult] =
      await Promise.all([
        supabase.from('product_categories').select('id, name').eq('is_active', true),
        supabase.from('product_subcategories').select('id, name, category_id').eq('is_active', true),
        supabase.from('product_sub_subcategories').select('id, name, subcategory_id').eq('is_active', true),
        supabase.from('product_sub_sub_subcategories').select('id, name, sub_subcategory_id').eq('is_active', true),
      ]);

    const categories = categoriesResult.data || [];
    const subcategories = subcategoriesResult.data || [];
    const subSubcategories = subSubcategoriesResult.data || [];
    const subSubSubcategories = subSubSubcategoriesResult.data || [];

    // Build category hierarchy text for AI prompt
    const categoryTree = categories
      .map((cat) => {
        const subs = subcategories.filter((s) => s.category_id === cat.id);
        const subTree = subs
          .map((sub) => {
            const subSubs = subSubcategories.filter((ss) => ss.subcategory_id === sub.id);
            const subSubTree = subSubs
              .map((subSub) => {
                const subSubSubs = subSubSubcategories.filter((sss) => sss.sub_subcategory_id === subSub.id);
                if (subSubSubs.length > 0) {
                  return `    - ${subSub.name}: [${subSubSubs.map((sss) => sss.name).join(', ')}]`;
                }
                return `    - ${subSub.name}`;
              })
              .join('\n');
            if (subSubTree) {
              return `  - ${sub.name}:\n${subSubTree}`;
            }
            return `  - ${sub.name}`;
          })
          .join('\n');
        if (subTree) {
          return `${cat.name}:\n${subTree}`;
        }
        return cat.name;
      })
      .join('\n\n');

    // Call OpenAI Vision API with validation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a strict product validation assistant for a fashion and collectibles marketplace. You ONLY accept images of actual sellable products.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `VALIDATION TASK: Analyze this image and determine its status for our fashion and collectibles marketplace.

RETURN ONE OF THREE RESPONSES:

1. IDENTIFIED - If you can clearly identify the product AND match it to our categories:
{
  "status": "identified",
  "suggestedName": "Product name (2-6 words)",
  "suggestedDescription": "Description (2-3 sentences)",
  "categoryPath": "Category > Subcategory > Type > Specific Type"
}

2. UNCERTAIN - If it appears to be a product BUT you cannot confidently categorize it:
{
  "status": "uncertain",
  "reason": "Brief explanation of why it's uncertain"
}

3. REJECTED - If the image is clearly NOT a sellable product or inappropriate:
{
  "status": "rejected",
  "reason": "Brief explanation of why it was rejected"
}

ACCEPTED PRODUCT CATEGORIES:
- Clothing (shirts, pants, jackets, dresses, etc.) - Models wearing clothing ARE acceptable
- Footwear (sneakers, shoes, boots, etc.) - Models wearing footwear ARE acceptable
- Accessories (bags, hats, jewelry, watches, etc.) - Models wearing accessories ARE acceptable
- Collectibles (trading cards, toys, memorabilia, etc.)
- Music (vinyl records, CDs, instruments, etc.)
- Games (video games, board games, gaming consoles, etc.)
- Electronics that match our categories
- Beauty products that match our categories

IMPORTANT: For clothing/footwear/accessories, focus on whether the PRODUCT is visible and identifiable, not whether there's a person in the image.

REJECT (status: "rejected"):
- Random animals or pets WITHOUT any product
- Portraits with NO visible product
- Nature scenes/landscapes WITHOUT any product
- Food items (unless collectible packaging)
- Household objects not in our categories
- Screenshots/digital content (unless game/media product)
- Nudity or inappropriate content
- Abstract art (unless on a sellable product)

UNCERTAIN (status: "uncertain"):
- Product is visible but category is unclear
- Product might fit multiple categories
- Image quality is too poor to identify accurately
- Product type is ambiguous

Our marketplace categories:
${categoryTree}

Use EXACT category names. Match as specifically as possible. Use " > " to separate levels.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify({ error: 'Failed to analyze image' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse AI response - strip markdown code blocks if present
    let parsedResponse;
    try {
      let jsonContent = content.trim();

      // Remove markdown code block wrapper if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      parsedResponse = JSON.parse(jsonContent);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    // Handle different response statuses
    const { status } = parsedResponse;

    // Case 1: Rejected - clearly not a valid product
    if (status === 'rejected') {
      return new Response(
        JSON.stringify({
          status: 'rejected',
          reason: parsedResponse.reason || 'This image does not appear to be a valid product for our marketplace.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Case 2: Uncertain - appears to be a product but can't categorize
    if (status === 'uncertain') {
      return new Response(
        JSON.stringify({
          status: 'uncertain',
          reason:
            parsedResponse.reason ||
            'Unable to identify this product. You can still use the image but please provide details manually.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Case 3: Identified - valid product with suggestions (backward compatibility with isValid: true)
    if (status === 'identified' || parsedResponse.isValid === true) {
      const { suggestedName, suggestedDescription, categoryPath } = parsedResponse;

      // Parse category path and match to database IDs
      const categoryHierarchy: CategoryHierarchy = {
        categoryId: null,
        categoryName: null,
        subcategoryId: null,
        subcategoryName: null,
        subSubcategoryId: null,
        subSubcategoryName: null,
        subSubSubcategoryId: null,
        subSubSubcategoryName: null,
      };

      if (categoryPath) {
        const parts = categoryPath.split(' > ').map((p: string) => p.trim());

        // Match category (Level 1)
        if (parts[0]) {
          const matchedCategory = categories.find((c) => c.name.toLowerCase() === parts[0].toLowerCase());
          if (matchedCategory) {
            categoryHierarchy.categoryId = matchedCategory.id;
            categoryHierarchy.categoryName = matchedCategory.name;

            // Match subcategory (Level 2)
            if (parts[1]) {
              const matchedSubcategory = subcategories.find(
                (s) => s.category_id === matchedCategory.id && s.name.toLowerCase() === parts[1].toLowerCase(),
              );
              if (matchedSubcategory) {
                categoryHierarchy.subcategoryId = matchedSubcategory.id;
                categoryHierarchy.subcategoryName = matchedSubcategory.name;

                // Match sub-subcategory (Level 3)
                if (parts[2]) {
                  const matchedSubSubcategory = subSubcategories.find(
                    (ss) =>
                      ss.subcategory_id === matchedSubcategory.id && ss.name.toLowerCase() === parts[2].toLowerCase(),
                  );
                  if (matchedSubSubcategory) {
                    categoryHierarchy.subSubcategoryId = matchedSubSubcategory.id;
                    categoryHierarchy.subSubcategoryName = matchedSubSubcategory.name;

                    // Match sub-sub-subcategory (Level 4)
                    if (parts[3]) {
                      const matchedSubSubSubcategory = subSubSubcategories.find(
                        (sss) =>
                          sss.sub_subcategory_id === matchedSubSubcategory.id &&
                          sss.name.toLowerCase() === parts[3].toLowerCase(),
                      );
                      if (matchedSubSubSubcategory) {
                        categoryHierarchy.subSubSubcategoryId = matchedSubSubSubcategory.id;
                        categoryHierarchy.subSubSubcategoryName = matchedSubSubSubcategory.name;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          status: 'identified',
          suggestedName: suggestedName || '',
          suggestedDescription: suggestedDescription || '',
          suggestedCategory: categoryHierarchy,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Unknown status - treat as error
    console.error('Unknown status from AI:', parsedResponse);
    return new Response(
      JSON.stringify({
        status: 'error',
        reason: 'Unable to process image. Please try again.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in analyze-product-image:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to analyze image',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
