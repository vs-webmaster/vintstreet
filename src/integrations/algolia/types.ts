// Types for Algolia product index
export interface AlgoliaProduct {
  objectID: string; // Product ID from database
  product_name: string;
  product_description?: string | null;
  sku?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  thumbnail?: string | null;
  product_images?: string[] | null;
  brand?: string | null;
  brand_id?: string | null;
  category?: string | null;
  category_id?: string | null;
  subcategory?: string | null;
  subcategory_id?: string | null;
  sub_subcategory?: string | null;
  sub_subcategory_id?: string | null;
  sub_sub_subcategory?: string | null;
  sub_sub_subcategory_id?: string | null;
  status: string;
  attributes?: Record<string, string[]>; // All product attributes organized by attribute name
  // For search ranking
  _tags?: string[];
}

// Types for Algolia category index
export interface AlgoliaCategory {
  objectID: string; // Category ID from database
  name: string;
  slug: string;
  level: number; // 1 = category, 2 = subcategory, 3 = sub_subcategory, 4 = sub_sub_subcategory
  description?: string | null;
  synonyms?: string[] | null;
  parent_id?: string | null; // ID of parent category
  parent_name?: string | null; // Name of parent category for display
  category_path?: string[] | null; // Full path from root to this category (slugs for URL building)
  category_path_names?: string[] | null; // Full path names for display
  is_active: boolean;
  // For search ranking
  _tags?: string[];
}

// Types for Algolia brand index
export interface AlgoliaBrand {
  objectID: string; // Brand ID from database
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  is_popular?: boolean | null;
  // For search ranking
  _tags?: string[];
}
