# Algolia AI Search Integration Guide

This guide will walk you through setting up Algolia AI Search for your VintStreet product search.

## Prerequisites

1. An Algolia account (sign up at https://www.algolia.com/)
2. Access to your Supabase project dashboard
3. Your project environment variables file

## Step 1: Create Algolia Account and Indexes

1. **Sign up for Algolia** at https://www.algolia.com/
2. **Create a new application** in your Algolia dashboard
3. **Create three indexes:**
   - `products` (or your preferred name) - for product search
   - `categories` (or your preferred name) - for category search
   - `brands` (or your preferred name) - for brand search
4. **Get your API keys:**
   - Application ID
   - Search-Only API Key (for frontend)
   - Admin API Key (for backend/syncing)

## Step 2: Configure Algolia Index Settings

### Products Index

In your Algolia dashboard, configure the `products` index with these settings:

### Searchable Attributes
Add these attributes as searchable (in order of importance):
- `product_name` (unordered)
- `product_description` (unordered)
- `excerpt` (unordered)
- `sku` (unordered)
- `brand` (unordered)
- `category` (unordered)
- `subcategory` (unordered)
- `sub_subcategory` (unordered)
- `sub_sub_subcategory` (unordered)

### Attributes for Faceting
- `brand`
- `brand_id`
- `category`
- `category_id`
- `subcategory`
- `subcategory_id`
- `sub_subcategory`
- `sub_subcategory_id`
- `sub_sub_subcategory`
- `sub_sub_subcategory_id`
- `status`
- `attributes` (object) - All product attributes organized by attribute name

### Ranking and Sorting
- Primary: Typo, Geo, Words
- Secondary: Proximity, Attribute, Exact
- Custom Ranking: `status:published` (higher priority)

### AI Features (Algolia AI Search)
Enable:
- ✅ AI-powered search
- ✅ Semantic search
- ✅ Query understanding
- ✅ Natural language processing

### Categories Index

In your Algolia dashboard, configure the `categories` index with these settings:

#### Searchable Attributes
Add these attributes as searchable (in order of importance):
- `name` (unordered)
- `description` (unordered)
- `synonyms` (unordered)
- `category_path_names` (unordered) - for searching by full category path

#### Attributes for Faceting
- `level` (1 = category, 2 = subcategory, 3 = sub_subcategory, 4 = sub_sub_subcategory)
- `is_active`
- `parent_id`
- `parent_name`

#### Ranking and Sorting
- Primary: Typo, Geo, Words
- Secondary: Proximity, Attribute, Exact
- Custom Ranking: `is_active:true` (higher priority), `level:1` (categories first)

#### AI Features (Algolia AI Search)
Enable:
- ✅ AI-powered search
- ✅ Semantic search
- ✅ Query understanding
- ✅ Natural language processing

### Brands Index

In your Algolia dashboard, configure the `brands` index with these settings:

#### Searchable Attributes
Add these attributes as searchable (in order of importance):
- `name` (unordered)
- `description` (unordered)

#### Attributes for Faceting
- `is_active`
- `is_popular`

#### Ranking and Sorting
- Primary: Typo, Geo, Words
- Secondary: Proximity, Attribute, Exact
- Custom Ranking: `is_active:true` (higher priority), `is_popular:true` (popular brands first)

#### AI Features (Algolia AI Search)
Enable:
- ✅ AI-powered search
- ✅ Semantic search
- ✅ Query understanding
- ✅ Natural language processing

## Step 3: Set Environment Variables

### Frontend Environment Variables

Create or update your `.env` file (or `.env.local` for local development):

```env
# Algolia Configuration
VITE_ALGOLIA_APP_ID=your_application_id_here
VITE_ALGOLIA_SEARCH_API_KEY=your_search_only_api_key_here
VITE_ALGOLIA_PRODUCTS_INDEX_NAME=products
VITE_ALGOLIA_CATEGORIES_INDEX_NAME=categories
VITE_ALGOLIA_BRANDS_INDEX_NAME=brands
VITE_ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX_NAME=products_query_suggestions
VITE_ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX_NAME=categories_query_suggestions
VITE_ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX_NAME=brands_query_suggestions
```

### Supabase Edge Functions Environment Variables

In your Supabase dashboard:

1. Go to **Project Settings** → **Edge Functions**
2. Add these secrets:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

ALGOLIA_APP_ID=your_application_id_here
ALGOLIA_ADMIN_API_KEY=your_admin_api_key_here
ALGOLIA_PRODUCTS_INDEX_NAME=products
ALGOLIA_CATEGORIES_INDEX_NAME=categories
ALGOLIA_BRANDS_INDEX_NAME=brands
ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX_NAME=products_query_suggestions
ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX_NAME=categories_query_suggestions
ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX_NAME=brands_query_suggestions
```

**Note:** The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` should already be available in your Supabase project settings.

## Step 4: Deploy Supabase Edge Functions

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Deploy the Edge Functions**:
   ```bash
   # Product sync function
   supabase functions deploy sync-products-to-algolia
   
   # Category sync function
   supabase functions deploy sync-categories-to-algolia
   
   # Brand sync function
   supabase functions deploy sync-brands-to-algolia
   ```

5. **Set the environment variables** for each function:
   ```bash
   supabase secrets set ALGOLIA_APP_ID=your_app_id
   supabase secrets set ALGOLIA_ADMIN_API_KEY=your_admin_key
   supabase secrets set ALGOLIA_PRODUCTS_INDEX_NAME=products
   supabase secrets set ALGOLIA_CATEGORIES_INDEX_NAME=categories
   supabase secrets set ALGOLIA_BRANDS_INDEX_NAME=brands
   supabase secrets set ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX_NAME=products_query_suggestions
   supabase secrets set ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX_NAME=categories_query_suggestions
   supabase secrets set ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX_NAME=brands_query_suggestions
   ```

## Step 5: Configure Database Settings

The migrations require a database configuration parameter to be set for the cron jobs to work. This allows the database functions to call the Edge Functions with proper authentication.

**Set the service role key in your database:**

```sql
ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'your_service_role_key_here';
```

Replace `your_service_role_key_here` with your actual Supabase service role key (found in **Project Settings** → **API** → **service_role key**).

**Note:** This is a database-level setting. If you're using Supabase, you may need to run this in the SQL Editor with appropriate permissions, or it may be set automatically depending on your Supabase configuration.

## Step 6: Initial Sync

### Initial Product Sync

You have several options for the initial product sync:

### Option A: Using the Helper Function (Recommended)

Create a temporary admin page or use the browser console:

```typescript
import { syncAllProductsToAlgolia } from '@/lib/algoliaSync';

// In your component or console
await syncAllProductsToAlgolia();
```

### Option B: Using Supabase Edge Function Directly

Call the sync function directly:

```typescript
const { data, error } = await supabase.functions.invoke('sync-products-to-algolia', {
  body: {
    action: 'sync',
    // Leave productIds empty to sync all products
  },
});
```

### Initial Category Sync

Sync all categories to Algolia:

```typescript
const { data, error } = await supabase.functions.invoke('sync-categories-to-algolia', {
  body: {
    action: 'sync',
    // Leave categoryIds empty to sync all categories
  },
});
```

### Initial Brand Sync

Sync all brands to Algolia:

```typescript
const { data, error } = await supabase.functions.invoke('sync-brands-to-algolia', {
  body: {
    action: 'sync',
    // Leave brandIds empty to sync all brands
  },
});
```

## Step 7: Verify the Integration

1. **Test the search** in your application's search bar
   - Brands should appear first in search results
   - Categories should appear after brands
   - Products should appear after categories
2. **Check Algolia dashboard** to see indexed products, categories, and brands
3. **Create/update a product** and verify it syncs automatically
4. **Create/update a category** and verify it syncs automatically
5. **Create/update a brand** and verify it syncs automatically

## How It Works

**Search**: The `SmartSearch` component uses Algolia's AI-powered search:
   - **Brands appear first** in search results
   - **Categories appear after brands** in search results (all 4 levels: category, subcategory, sub_subcategory, sub_sub_subcategory)
   - **Products appear after categories** in search results

### Manual Syncing

You can manually sync products, categories, and brands using the helper functions in `src/lib/algoliaSync.ts`:

**Products:**
- `syncProductsToAlgolia(productIds)` - Sync specific products by ID array
- `deleteProductsFromAlgolia(productIds)` - Delete products from Algolia by ID array
- `syncAllProductsToAlgolia()` - Sync all published products (batched automatically)

**Categories:**
- `syncCategoriesToAlgolia(categoryIds)` - Sync specific categories by ID array
- `syncAllCategoriesToAlgolia()` - Sync all active categories from all 4 levels (batched automatically)

**Brands:**
- `syncBrandsToAlgolia(brandIds)` - Sync specific brands by ID array
- `syncAllBrandsToAlgolia()` - Sync all active brands (batched automatically)

### Sync Queue Not Processing

1. **Check if the Edge Functions are deployed:**
   ```bash
   supabase functions list
   ```
   You should see:
   - `sync-products-to-algolia`
   - `sync-categories-to-algolia`
   - `sync-brands-to-algolia`

2. **Check Edge Function logs:**
   ```bash
   supabase functions logs sync-products-to-algolia
   supabase functions logs sync-categories-to-algolia
   supabase functions logs sync-brands-to-algolia
   ```

3. **Verify environment variables in Supabase dashboard:**
   - Go to **Project Settings** → **Edge Functions** → **Secrets**
   - Ensure all required secrets are set (see Step 3)

4. **Manually test the sync functions:**
   ```typescript
   import { syncProductsToAlgolia } from '@/lib/algoliaSync';
   
   // Test with a single product ID
   await syncProductsToAlgolia(['your-product-id-here']);
   ```

### Search Not Working

1. Verify frontend environment variables are set
2. Check browser console for errors
3. Verify Algolia index name matches your configuration
4. Check Algolia dashboard for API usage and errors

## Monitoring

### Algolia Dashboard
- Monitor search analytics
- View API usage
- Check for errors

## Product Attributes for Filtering

### How Attributes Are Connected

Products have attributes stored in the `product_attribute_values` table, which links products to attributes via the `attributes` table. When products are synced to Algolia, the sync functions automatically:

1. **Fetch all attribute values** for each product from `product_attribute_values`
2. **Organize attributes by product ID and attribute name** (using the attribute's `display_label` or `name`)
3. **Parse attribute values** correctly, handling:
   - JSON arrays (for multi-select attributes)
   - Single string values

### Attribute Structure in Algolia

Each product in Algolia includes:
- `attributes`: An object containing all product attributes, where keys are attribute names (lowercased) and values are arrays of attribute values

Example structure:
```json
{
  "objectID": "product-123",
  "product_name": "T-Shirt",
  "attributes": {
    "color": ["Red", "Blue"],
    "size": ["S", "M", "L"],
    "material": ["Cotton"]
  }
}
```

The attributes are automatically populated from the `product_attribute_values` table when products are synced. Multi-select attributes are parsed as arrays, while single-select attributes are stored as single-item arrays.

### Using Attributes for Filtering

You can use the `attributes` object in Algolia for faceting and filtering. To enable filtering, you'll need to configure the attribute fields as facets in your Algolia index settings.

**In Algolia Dashboard:**
1. Go to your `products` index
2. Navigate to **Configuration** → **Facets**
3. Add the attribute fields you want to filter by (e.g., `attributes.color`, `attributes.size`)

**In your code:**
```typescript
// Example: Filter products by color
const searchParams = {
  facetFilters: [['attributes.color:Red']]
};

// Example: Filter products by size
const searchParams = {
  facetFilters: [['attributes.size:M']]
};

// Example: Filter by multiple colors
const searchParams = {
  facetFilters: [['attributes.color:Red', 'attributes.color:Blue']]
};
```

**Note:** The attribute names in the `attributes` object are lowercased versions of the attribute's `display_label` or `name` from your database. Make sure to use the correct casing when setting up facets.

## Next Steps

1. **Optimize Search Results**: Configure Algolia's relevance settings based on your search analytics
2. **Add Faceting**: Implement filters for brand, category, price range, colors, sizes, etc.
3. **Analytics**: Set up Algolia Analytics to track search performance
4. **A/B Testing**: Use Algolia's A/B testing features to optimize search
5. **Category Synonyms**: Add synonyms to categories to improve search discoverability
6. **Brand Management**: Use the Algolia Sync Manager in the admin dashboard to manage brand syncing
7. **Monitor All Queues**: Regularly check product, category, and brand sync queues to ensure everything is syncing properly
8. **Attribute Filtering**: Implement frontend filters using the `attributes` object in Algolia. Configure attribute fields as facets in your Algolia index settings.

## Support

For issues or questions:
- Algolia Documentation: https://www.algolia.com/doc/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

