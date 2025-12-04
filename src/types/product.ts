// Centralized Product Types
// All product-related type definitions in one place

export interface Product {
  id: string;
  slug?: string;
  product_name: string;
  starting_price: number;
  discounted_price: number | null;
  thumbnail: string | null;
  product_image?: string | null;
  product_images?: string[] | null;
  product_description: string | null;
  excerpt?: string | null;
  seller_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  sub_subcategory_id: string | null;
  sub_sub_subcategory_id: string | null;
  brand_id: string | null;
  status: ProductStatus;
  stock_quantity: number | null;
  created_at: string;
  updated_at?: string;
  auction_type: string | null;
  auction_end_time?: string | null;
  offers_enabled?: boolean | null;
  product_type?: string;
  sku?: string | null;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  view_count?: number | null;
  archived?: boolean;
  moderation_status?: string | null;
  moderation_reason?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  // Relations
  product_categories?: ProductCategory | null;
  product_subcategories?: ProductCategory | null;
  product_sub_subcategories?: ProductCategory | null;
  product_sub_sub_subcategories?: ProductCategory | null;
  brands?: ProductBrand | null;
  seller_info_view?: SellerInfoView | null;
  seller_profiles?: {
    shop_name: string;
    display_name_format?: string;
    profile?: { full_name?: string; username?: string };
    profiles?: { full_name?: string; username?: string };
  } | null;
  auctions?: ProductAuction[];
  product_image_alts?: string[] | null;
}

export type ProductStatus = 'draft' | 'published' | 'private' | 'out_of_stock' | 'active';

export interface ProductCategory {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  is_active?: boolean;
}

export interface ProductBrand {
  id: string;
  name: string;
  logo_url?: string | null;
  is_active?: boolean | null;
  is_popular?: boolean | null;
}

export interface SellerInfoView {
  shop_name: string;
  display_name_format?: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

export interface ProductAuction {
  id: string;
  current_bid: number | null;
  starting_bid: number | null;
  end_time: string;
  status: string;
  bid_count: number | null;
  reserve_price?: number;
  reserve_met?: boolean | null;
  winner_id?: string | null;
}

export interface ProductAttribute {
  id: string;
  attribute_id: string;
  product_id: string;
  value_text?: string | null;
  value_number?: number | null;
  value_boolean?: boolean | null;
  value_date?: string | null;
  attribute?: {
    id: string;
    name: string;
    display_label?: string | null;
    data_type: string;
  };
}

export interface ProductFilters {
  categoryId?: string | null;
  subcategoryId?: string | null;
  subSubcategoryId?: string | null;
  subSubSubcategoryId?: string | null;
  brandIds?: string[];
  colors?: string[];
  sizes?: string[];
  priceRange?: { min: number; max: number } | null;
  status?: ProductStatus[];
  sellerId?: string | null;
  search?: string;
  sortBy?: ProductSortOption;
  attributes?: Map<string, Set<string>>;
}

export type ProductSortOption = 
  | 'featured'
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'name-asc'
  | 'name-desc';

export interface ProductListResponse {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  nextPage?: number;
}

// Type guards
export const isProduct = (obj: unknown): obj is Product => {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.product_name === 'string' &&
    typeof p.starting_price === 'number' &&
    typeof p.seller_id === 'string'
  );
};

export const isAuctionProduct = (product: Product): boolean => {
  return product.auction_type === 'timed' && 
         Array.isArray(product.auctions) && 
         product.auctions.length > 0;
};

export const getActiveAuction = (product: Product): ProductAuction | null => {
  if (!isAuctionProduct(product)) return null;
  return product.auctions?.[0] || null;
};

export const getCurrentPrice = (product: Product): number => {
  if (isAuctionProduct(product)) {
    const auction = getActiveAuction(product);
    return auction?.current_bid || auction?.starting_bid || product.starting_price;
  }
  return product.discounted_price || product.starting_price;
};

export const hasDiscount = (product: Product): boolean => {
  return !isAuctionProduct(product) && 
         product.discounted_price !== null && 
         product.discounted_price < product.starting_price;
};
