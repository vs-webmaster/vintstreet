// Centralized Order Types
// All order-related type definitions in one place

export type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type DeliveryStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'returned';

export type PayoutStatus = 
  | 'pending'
  | 'clearing'
  | 'available'
  | 'paid'
  | 'on_hold';

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  stream_id?: string | null;
  order_amount: number;
  quantity: number;
  status: OrderStatus;
  delivery_status?: DeliveryStatus | null;
  payout_status?: PayoutStatus | null;
  order_date: string;
  created_at: string;
  updated_at: string;
  // Shipping info
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_email?: string | null;
  shipping_phone?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  shipping_method?: string | null;
  shipping_cost?: number | null;
  // Payment info
  payment_intent_id?: string | null;
  stripe_session_id?: string | null;
  platform_fee?: number | null;
  seller_payout?: number | null;
  funds_released?: boolean | null;
  funds_available_at?: string | null;
  // Tracking
  tracking_number?: string | null;
  carrier?: string | null;
  label_url?: string | null;
  // Buyer confirmation
  buyer_confirmed?: boolean | null;
  issue_reported?: boolean | null;
  issue_description?: string | null;
  // Relations
  listing?: OrderListing | null;
  buyer?: OrderUser | null;
  seller?: OrderSeller | null;
}

export interface OrderListing {
  id: string;
  product_name: string;
  thumbnail?: string | null;
  product_image?: string | null;
  starting_price: number;
  discounted_price?: number | null;
}

export interface OrderUser {
  id: string;
  email?: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

export interface OrderSeller {
  user_id: string;
  shop_name?: string | null;
  full_name?: string | null;
}

export interface OrderFilters {
  buyerId?: string;
  sellerId?: string;
  status?: OrderStatus[];
  deliveryStatus?: DeliveryStatus[];
  payoutStatus?: PayoutStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export interface OrderListResponse {
  orders: Order[];
  totalCount: number;
  hasMore: boolean;
}

// Type guards
export const isOrder = (obj: unknown): obj is Order => {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.listing_id === 'string' &&
    typeof o.buyer_id === 'string' &&
    typeof o.seller_id === 'string' &&
    typeof o.order_amount === 'number'
  );
};

export const isOrderPending = (order: Order): boolean => {
  return order.status === 'pending' || order.status === 'processing';
};

export const isOrderShipped = (order: Order): boolean => {
  return order.delivery_status === 'shipped' || order.delivery_status === 'delivered';
};

export const canCancelOrder = (order: Order): boolean => {
  return order.status === 'pending' && order.delivery_status !== 'shipped';
};
