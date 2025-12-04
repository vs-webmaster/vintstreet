// Supabase Edge Function to sync categories to Algolia
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALGOLIA_APP_ID = Deno.env.get('ALGOLIA_APP_ID') || '';
const ALGOLIA_ADMIN_API_KEY = Deno.env.get('ALGOLIA_ADMIN_API_KEY') || '';
const ALGOLIA_CATEGORIES_INDEX_NAME = Deno.env.get('ALGOLIA_CATEGORIES_INDEX_NAME') || 'categories';
const ALGOLIA_BASE_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_CATEGORIES_INDEX_NAME}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { categoryIds, action } = await req.json();

    // Helper function to call Algolia API using native fetch
    const algoliaRequest = async (method: string, endpoint: string, body?: any) => {
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
    if (action === 'delete' && categoryIds && Array.isArray(categoryIds)) {
      // Delete categories from Algolia using batch delete
      await algoliaRequest('POST', '/batch', {
        requests: categoryIds.map((id) => ({
          action: 'deleteObject',
          body: { objectID: id },
        })),
      });
      return new Response(
        JSON.stringify({ success: true, message: `Deleted ${categoryIds.length} categories from Algolia` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch all categories from all levels
    let categoriesQuery = supabase
      .from('product_categories')
      .select(
        `
        id,
        name,
        slug,
        description,
        synonyms,
        is_active
      `,
      )
      .eq('is_active', true);

    let subcategoriesQuery = supabase
      .from('product_subcategories')
      .select(
        `
        id,
        name,
        slug,
        description,
        synonyms,
        is_active,
        category_id,
        product_categories!product_subcategories_category_id_fkey!inner(name, slug)
      `,
      )
      .eq('is_active', true);

    let subSubcategoriesQuery = supabase
      .from('product_sub_subcategories')
      .select(
        `
        id,
        name,
        slug,
        description,
        synonyms,
        is_active,
        subcategory_id,
        product_subcategories!inner(name, slug, category_id, product_categories!product_subcategories_category_id_fkey!inner(name, slug))
      `,
      )
      .eq('is_active', true);

    let subSubSubcategoriesQuery = supabase
      .from('product_sub_sub_subcategories')
      .select(
        `
        id,
        name,
        slug,
        description,
        synonyms,
        is_active,
        sub_subcategory_id,
        product_sub_subcategories!product_sub_sub_subcategories_sub_subcategory_id_fkey!inner(name, slug, subcategory_id, product_subcategories!inner(name, slug, category_id, product_categories!product_subcategories_category_id_fkey!inner(name, slug)))
      `,
      )
      .eq('is_active', true);

    // If specific category IDs provided, filter by them
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      categoriesQuery = categoriesQuery.in('id', categoryIds);
      subcategoriesQuery = subcategoriesQuery.in('id', categoryIds);
      subSubcategoriesQuery = subSubcategoriesQuery.in('id', categoryIds);
      subSubSubcategoriesQuery = subSubSubcategoriesQuery.in('id', categoryIds);
    }

    const [categoriesResult, subcategoriesResult, subSubcategoriesResult, subSubSubcategoriesResult] =
      await Promise.all([categoriesQuery, subcategoriesQuery, subSubcategoriesQuery, subSubSubcategoriesQuery]);

    if (categoriesResult.error) {
      throw categoriesResult.error;
    }
    if (subcategoriesResult.error) {
      throw subcategoriesResult.error;
    }
    if (subSubcategoriesResult.error) {
      throw subSubcategoriesResult.error;
    }
    if (subSubSubcategoriesResult.error) {
      throw subSubSubcategoriesResult.error;
    }

    // Transform categories for Algolia
    const algoliaCategories: any[] = [];

    // Level 1: Categories
    (categoriesResult.data || []).forEach((cat: any) => {
      algoliaCategories.push({
        objectID: cat.id,
        name: cat.name,
        slug: cat.slug,
        level: 1,
        description: cat.description || null,
        synonyms: cat.synonyms || [],
        parent_id: null,
        parent_name: null,
        category_path: [cat.slug],
        category_path_names: [cat.name],
        is_active: cat.is_active ?? true,
        _tags: ['level:1', `category:${cat.name.toLowerCase()}`],
      });
    });

    // Level 2: Subcategories
    (subcategoriesResult.data || []).forEach((sub: any) => {
      const parentCategory = sub.product_categories;
      algoliaCategories.push({
        objectID: sub.id,
        name: sub.name,
        slug: sub.slug,
        level: 2,
        description: sub.description || null,
        synonyms: sub.synonyms || [],
        parent_id: sub.category_id,
        parent_name: parentCategory?.name || null,
        category_path: [parentCategory?.slug, sub.slug].filter(Boolean),
        category_path_names: [parentCategory?.name, sub.name].filter(Boolean),
        is_active: sub.is_active ?? true,
        _tags: [
          'level:2',
          `category:${parentCategory?.name?.toLowerCase() || ''}`,
          `subcategory:${sub.name.toLowerCase()}`,
        ],
      });
    });

    // Level 3: Sub-subcategories
    (subSubcategoriesResult.data || []).forEach((subSub: any) => {
      const parentSub = subSub.product_subcategories;
      const parentCategory = parentSub?.product_categories;
      algoliaCategories.push({
        objectID: subSub.id,
        name: subSub.name,
        slug: subSub.slug,
        level: 3,
        description: subSub.description || null,
        synonyms: subSub.synonyms || [],
        parent_id: subSub.subcategory_id,
        parent_name: parentSub?.name || null,
        category_path: [parentCategory?.slug, parentSub?.slug, subSub.slug].filter(Boolean),
        category_path_names: [parentCategory?.name, parentSub?.name, subSub.name].filter(Boolean),
        is_active: subSub.is_active ?? true,
        _tags: [
          'level:3',
          `category:${parentCategory?.name?.toLowerCase() || ''}`,
          `subcategory:${parentSub?.name?.toLowerCase() || ''}`,
          `sub_subcategory:${subSub.name.toLowerCase()}`,
        ],
      });
    });

    // Level 4: Sub-sub-subcategories
    (subSubSubcategoriesResult.data || []).forEach((subSubSub: any) => {
      const parentSubSub = subSubSub.product_sub_subcategories;
      const parentSub = parentSubSub?.product_subcategories;
      const parentCategory = parentSub?.product_categories;
      algoliaCategories.push({
        objectID: subSubSub.id,
        name: subSubSub.name,
        slug: subSubSub.slug,
        level: 4,
        description: subSubSub.description || null,
        synonyms: subSubSub.synonyms || [],
        parent_id: subSubSub.sub_subcategory_id,
        parent_name: parentSubSub?.name || null,
        category_path: [parentCategory?.slug, parentSub?.slug, parentSubSub?.slug, subSubSub.slug].filter(Boolean),
        category_path_names: [parentCategory?.name, parentSub?.name, parentSubSub?.name, subSubSub.name].filter(
          Boolean,
        ),
        is_active: subSubSub.is_active ?? true,
        _tags: [
          'level:4',
          `category:${parentCategory?.name?.toLowerCase() || ''}`,
          `subcategory:${parentSub?.name?.toLowerCase() || ''}`,
          `sub_subcategory:${parentSubSub?.name?.toLowerCase() || ''}`,
          `sub_sub_subcategory:${subSubSub.name.toLowerCase()}`,
        ],
      });
    });

    // Filter by categoryIds if provided (already filtered in queries, but double-check)
    let categoriesToSync = algoliaCategories;
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      categoriesToSync = algoliaCategories.filter((cat: any) => categoryIds.includes(cat.objectID));
    }

    if (categoriesToSync.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No categories to sync', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save to Algolia using batch operation via REST API
    const batchResponse = await algoliaRequest('POST', '/batch', {
      requests: categoriesToSync.map((category: any) => ({
        action: 'updateObject',
        body: category,
      })),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${categoriesToSync.length} categories to Algolia`,
        count: categoriesToSync.length,
        taskIDs: batchResponse.taskIDs || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Error syncing categories to Algolia:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
