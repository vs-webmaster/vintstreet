// Centralized Cart Types
// All cart-related type definitions in one place

import type { Product } from './product';

export interface CartItem {
  id: string;
  listing_id: string;
  user_id: string;
  quantity: number;
  created_at: string;
  // Related product data
  listing?: CartItemProduct | null;
}

export interface CartItemProduct {
  id: string;
  product_name: string;
  starting_price: number;
  discounted_price?: number | null;
  thumbnail?: string | null;
  product_image?: string | null;
  seller_id: string;
  status?: string;
  stock_quantity?: number | null;
  weight?: number | null;
  brands?: {
    id: string;
    name: string;
  } | null;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  totalWeight: number;
}

export interface CartOperationResult {
  success: boolean;
  message?: string;
  item?: CartItem;
}

// Calculate cart totals
export const calculateCartSummary = (items: CartItem[]): CartSummary => {
  let itemCount = 0;
  let subtotal = 0;
  let totalWeight = 0;

  items.forEach((item) => {
    if (!item.listing) return;
    
    const quantity = item.quantity || 1;
    const price = item.listing.discounted_price ?? item.listing.starting_price;
    
    itemCount += quantity;
    subtotal += price * quantity;
    totalWeight += (item.listing.weight || 0) * quantity;
  });

  return {
    itemCount,
    subtotal,
    shippingCost: 0, // Calculated separately based on shipping selection
    discount: 0, // Applied from coupons/promotions
    total: subtotal,
    totalWeight,
  };
};

// Check if cart item is available
export const isCartItemAvailable = (item: CartItem): boolean => {
  if (!item.listing) return false;
  if (item.listing.status === 'out_of_stock') return false;
  if (item.listing.stock_quantity !== null && item.listing.stock_quantity < (item.quantity || 1)) {
    return false;
  }
  return true;
};

// Type guard
export const isCartItem = (obj: unknown): obj is CartItem => {
  if (!obj || typeof obj !== 'object') return false;
  const ci = obj as Record<string, unknown>;
  return (
    typeof ci.id === 'string' &&
    typeof ci.listing_id === 'string' &&
    typeof ci.user_id === 'string'
  );
};
