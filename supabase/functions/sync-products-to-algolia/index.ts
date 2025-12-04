// Supabase Edge Function to sync products to Algolia
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALGOLIA_APP_ID = Deno.env.get('ALGOLIA_APP_ID') || '';
const ALGOLIA_ADMIN_API_KEY = Deno.env.get('ALGOLIA_ADMIN_API_KEY') || '';
const ALGOLIA_PRODUCTS_INDEX_NAME = Deno.env.get('ALGOLIA_PRODUCTS_INDEX_NAME') || 'products';
const ALGOLIA_BASE_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_PRODUCTS_INDEX_NAME}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  product_name: string;
  product_description?: string | null;
  sku?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  thumbnail?: string | null;
  product_images?: string[] | null;
  starting_price?: number | null;
  discounted_price?: number | null;
  brand_id?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  sub_subcategory_id?: string | null;
  sub_sub_subcategory_id?: string | null;
  status: string;
  brands?: { name: string } | { name: string }[] | null;
  product_categories?: { name: string } | { name: string }[] | null;
  product_subcategories?: { name: string } | { name: string }[] | null;
  product_sub_subcategories?: { name: string } | { name: string }[] | null;
  product_sub_sub_subcategories?: { name: string } | { name: string }[] | null;
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

    const { productIds, action } = await req.json();

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
    if (action === 'delete' && productIds && Array.isArray(productIds)) {
      // Delete products from Algolia using batch delete
      await algoliaRequest('POST', '/batch', {
        requests: productIds.map((id) => ({
          action: 'deleteObject',
          body: { objectID: id },
        })),
      });
      return new Response(
        JSON.stringify({ success: true, message: `Deleted ${productIds.length} products from Algolia` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Helper function to parse attribute values from value_text
    const parseAttributeValue = (dataType: string, valueText: string | null): string[] => {
      if (dataType === 'multi-select') {
        return JSON.parse(valueText || '[]');
      } else {
        return [valueText || ''];
      }
    };

    // Fetch products from database
    let query = supabase
      .from('listings')
      .select(
        `
        id,
        product_name,
        product_description,
        sku,
        excerpt,
        slug,
        thumbnail,
        product_images,
        starting_price,
        discounted_price,
        brand_id,
        category_id,
        subcategory_id,
        sub_subcategory_id,
        sub_sub_subcategory_id,
        status,
        brands(name),
        product_categories(name),
        product_subcategories(name),
        product_sub_subcategories(name),
        product_sub_sub_subcategories(name)
      `,
      )
      .eq('product_type', 'shop')
      .eq('status', 'published')
      .eq('archived', false);

    // If specific product IDs provided, filter by them
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      query = query.in('id', productIds);
    }

    const { data: products, error } = await query;

    if (error) {
      throw error;
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No products to sync', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all attribute values for these products
    const productIdsList = products.map((p: Product) => p.id);
    const { data: attributeValues } = await supabase
      .from('product_attribute_values')
      .select(
        `
        product_id,
        value_text,
        attributes(
          id,
          name,
          data_type,
          display_label
        )
      `,
      )
      .in('product_id', productIdsList)
      .not('value_text', 'is', null);

    // Organize attributes by product ID and attribute name
    const attributesByProduct = new Map<string, Map<string, string[]>>();

    if (attributeValues) {
      for (const attrValue of attributeValues as any[]) {
        const productId = attrValue.product_id;
        const attrName = (attrValue.attributes?.display_label || attrValue.attributes?.name || '').toLowerCase();
        const values = parseAttributeValue(attrValue.attributes?.data_type, attrValue.value_text);

        if (!attributesByProduct.has(productId)) {
          attributesByProduct.set(productId, new Map());
        }

        const productAttrs = attributesByProduct.get(productId)!;
        if (!productAttrs.has(attrName)) {
          productAttrs.set(attrName, []);
        }

        productAttrs.get(attrName)!.push(...values);
      }
    }

    // Transform products for Algolia
    const algoliaProducts = products.map((product: Product) => {
      const brands = Array.isArray(product.brands) ? product.brands[0] : product.brands;
      const categories = Array.isArray(product.product_categories)
        ? product.product_categories[0]
        : product.product_categories;
      const subcategories = Array.isArray(product.product_subcategories)
        ? product.product_subcategories[0]
        : product.product_subcategories;
      const subSubcategories = Array.isArray(product.product_sub_subcategories)
        ? product.product_sub_subcategories[0]
        : product.product_sub_subcategories;
      const subSubSubcategories = Array.isArray(product.product_sub_sub_subcategories)
        ? product.product_sub_sub_subcategories[0]
        : product.product_sub_sub_subcategories;

      // Get attributes for this product
      const productAttrs = attributesByProduct.get(product.id) || new Map();

      return {
        objectID: product.id,
        product_name: product.product_name,
        product_description: product.product_description || null,
        sku: product.sku || null,
        excerpt: product.excerpt || null,
        slug: product.slug || null,
        thumbnail: product.thumbnail || null,
        product_images: product.product_images || [],
        starting_price: product.starting_price || null,
        discounted_price: product.discounted_price || null,
        brand: brands?.name || null,
        brand_id: product.brand_id || null,
        category: categories?.name || null,
        category_id: product.category_id || null,
        subcategory: subcategories?.name || null,
        subcategory_id: product.subcategory_id || null,
        sub_subcategory: subSubcategories?.name || null,
        sub_subcategory_id: product.sub_subcategory_id || null,
        sub_sub_subcategory: subSubSubcategories?.name || null,
        sub_sub_subcategory_id: product.sub_sub_subcategory_id || null,
        status: product.status,
        attributes: Object.fromEntries(productAttrs),
        _tags: [
          product.status === 'published' ? 'published' : 'unpublished',
          ...(brands?.name ? [`brand:${brands.name.toLowerCase()}`] : []),
          ...(categories?.name ? [`category:${categories.name.toLowerCase()}`] : []),
          ...(subcategories?.name ? [`subcategory:${subcategories.name.toLowerCase()}`] : []),
          ...(subSubcategories?.name ? [`sub_subcategory:${subSubcategories.name.toLowerCase()}`] : []),
          ...(subSubSubcategories?.name ? [`sub_sub_subcategory:${subSubSubcategories.name.toLowerCase()}`] : []),
        ],
      };
    });

    // Save to Algolia using batch operation via REST API
    const batchResponse = await algoliaRequest('POST', '/batch', {
      requests: algoliaProducts.map((product) => ({
        action: 'updateObject',
        body: product,
      })),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${algoliaProducts.length} products to Algolia`,
        count: algoliaProducts.length,
        taskIDs: batchResponse.taskIDs || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    console.error('Error syncing products to Algolia:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
