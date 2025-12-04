import algoliasearch from 'algoliasearch/lite';

// Algolia configuration
// These should be set as environment variables
const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID || '';
const ALGOLIA_SEARCH_API_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY || '';
const ALGOLIA_PRODUCTS_INDEX_NAME = import.meta.env.VITE_ALGOLIA_PRODUCTS_INDEX_NAME || 'products';
const ALGOLIA_CATEGORIES_INDEX_NAME = import.meta.env.VITE_ALGOLIA_CATEGORIES_INDEX_NAME || 'categories';
const ALGOLIA_BRANDS_INDEX_NAME = import.meta.env.VITE_ALGOLIA_BRANDS_INDEX_NAME || 'brands';
const ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX_NAME = import.meta.env.VITE_ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX_NAME || 'products_query_suggestions';
const ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX_NAME = import.meta.env.VITE_ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX_NAME || 'categories_query_suggestions';
const ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX_NAME = import.meta.env.VITE_ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX_NAME || 'brands_query_suggestions';

// Initialize Algolia client
export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY);

// Get the products index
export const productsIndex = searchClient.initIndex(ALGOLIA_PRODUCTS_INDEX_NAME);

// Get the categories index
export const categoriesIndex = searchClient.initIndex(ALGOLIA_CATEGORIES_INDEX_NAME);

// Get the brands index
export const brandsIndex = searchClient.initIndex(ALGOLIA_BRANDS_INDEX_NAME);

// Get the query suggestions indexes
export const productsQuerySuggestionsIndex = searchClient.initIndex(ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX_NAME);
export const categoriesQuerySuggestionsIndex = searchClient.initIndex(ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX_NAME);
export const brandsQuerySuggestionsIndex = searchClient.initIndex(ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX_NAME);

// Export the search client for use with react-instantsearch
export default searchClient;
