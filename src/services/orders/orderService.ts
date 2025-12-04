/* eslint-disable @typescript-eslint/no-explicit-any */
// Order Service
// Centralized data access for order-related operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';
import type { Order } from '@/types/order';

// Default select fields for orders
const ORDER_SELECT = `
  *,
  listings:listing_id (
    id,
    product_name,
    thumbnail,
    starting_price,
    discounted_price,
    seller_id,
    weight
  )
`;

// Extended select with buyer/seller info
const ORDER_WITH_PROFILES_SELECT = `
  ${ORDER_SELECT},
  buyer:buyer_id (
    user_id,
    username,
    full_name,
    avatar_url
  ),
  seller:seller_id (
    user_id,
    username,
    full_name,
    avatar_url
  )
`;

export interface OrderFilters {
  status?: string;
  deliveryStatus?: string;
  payoutStatus?: string;
  buyerId?: string;
  sellerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateOrderInput {
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  stream_id: string;
  order_amount: number;
  quantity?: number;
  display_amount?: number;
  display_currency?: string;
  exchange_rate_used?: number;
  amount_gbp?: number;
  status?: string;
  delivery_status?: string;
}

export interface UpdateOrderInput {
  status?: string;
  delivery_status?: string;
  tracking_number?: string;
  payout_status?: string;
  buyer_confirmed?: boolean;
  issue_reported?: boolean;
  issue_description?: string;
}

// Fetch all orders (admin - minimal fields for stats)
export async function fetchAllOrdersMinimal(): Promise<
  Result<Array<{ order_amount: number; status: string; delivery_status: string }>>
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('orders').select('order_amount, status, delivery_status');

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchAllOrdersMinimal');
}

// Fetch orders with filters
export async function fetchOrders(
  filters: OrderFilters = {},
  page = 1,
  pageSize = 20,
): Promise<Result<{ data: Order[]; totalCount: number }>> {
  return withErrorHandling(async () => {
    let query = supabase.from('orders').select(ORDER_SELECT, { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.deliveryStatus) {
      query = query.eq('delivery_status', filters.deliveryStatus);
    }
    if (filters.payoutStatus) {
      query = query.eq('payout_status', filters.payoutStatus);
    }
    if (filters.buyerId) {
      query = query.eq('buyer_id', filters.buyerId);
    }
    if (filters.sellerId) {
      query = query.eq('seller_id', filters.sellerId);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw error;

    return {
      data: (data || []) as unknown as Order[],
      error: null,
      totalCount: count || 0,
    };
  }, 'fetchOrders') as Promise<Result<{ data: Order[]; totalCount: number }>>;
}

// Fetch a single order by ID
export async function fetchOrderById(orderId: string): Promise<Result<Order>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('orders').select(ORDER_WITH_PROFILES_SELECT).eq('id', orderId).single();

    if (error) throw error;
    return { data: data as unknown as Order, error: null };
  }, 'fetchOrderById');
}

// Fetch orders for a buyer
export async function fetchBuyerOrders(
  buyerId: string,
  page = 1,
  pageSize = 20,
): Promise<Result<{ data: Order[]; totalCount: number }>> {
  return fetchOrders({ buyerId }, page, pageSize);
}

// Fetch orders for a seller
export async function fetchSellerOrders(
  sellerId: string,
  filters: Omit<OrderFilters, 'sellerId'> = {},
  page = 1,
  pageSize = 20,
): Promise<Result<{ data: Order[]; totalCount: number }>> {
  return fetchOrders({ ...filters, sellerId }, page, pageSize);
}

// Fetch orders for a user (either as buyer or seller)
export async function fetchUserOrders(
  userId: string,
  page = 1,
  pageSize = 1000,
): Promise<Result<{ data: Order[]; totalCount: number }>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('orders')
      .select(ORDER_SELECT, { count: 'exact' })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw error;

    return {
      data: (data || []) as unknown as Order[],
      error: null,
      totalCount: count || 0,
    };
  }, 'fetchUserOrders') as Promise<Result<{ data: Order[]; totalCount: number }>>;
}

// Create a new order
export async function createOrder(input: CreateOrderInput): Promise<Result<Order | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        listing_id: input.listing_id,
        buyer_id: input.buyer_id,
        seller_id: input.seller_id,
        stream_id: input.stream_id,
        order_amount: input.order_amount,
        quantity: input.quantity || 1,
        display_amount: input.display_amount,
        display_currency: input.display_currency,
        exchange_rate_used: input.exchange_rate_used,
        amount_gbp: input.amount_gbp,
        status: input.status,
        delivery_status: input.delivery_status,
      })
      .select(ORDER_SELECT)
      .single();

    if (error) throw error;
    return { data: data as unknown as Order, error: null };
  }, 'createOrder');
}

// Update an order
export async function updateOrder(orderId: string, updates: UpdateOrderInput): Promise<Result<Order | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select(ORDER_SELECT)
      .single();

    if (error) throw error;
    return { data: data as unknown as Order, error: null };
  }, 'updateOrder');
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string): Promise<Result<Order | null>> {
  return updateOrder(orderId, { status });
}

// Update delivery status
export async function updateDeliveryStatus(
  orderId: string,
  deliveryStatus: string,
  trackingNumber?: string,
): Promise<Result<Order | null>> {
  return updateOrder(orderId, {
    delivery_status: deliveryStatus,
    ...(trackingNumber && { tracking_number: trackingNumber }),
  });
}

// Confirm order received by buyer
export async function confirmOrderReceived(orderId: string): Promise<Result<Order | null>> {
  return updateOrder(orderId, {
    buyer_confirmed: true,
    delivery_status: 'delivered',
  });
}

// Update multiple orders by buyer ID and status
export async function updateOrdersByBuyerAndStatus(
  buyerId: string,
  oldStatus: string,
  updates: UpdateOrderInput,
): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('orders').update(updates).eq('buyer_id', buyerId).eq('status', oldStatus);

    if (error) throw error;
    return { data: true, error: null };
  }, 'updateOrdersByBuyerAndStatus');
}

// Report issue with order
export async function reportOrderIssue(orderId: string, description: string): Promise<Result<Order | null>> {
  return updateOrder(orderId, {
    issue_reported: true,
    issue_description: description,
  });
}

// Get order counts by status for dashboard
export async function getOrderCountsByStatus(sellerId: string): Promise<Result<Record<string, number>>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('orders').select('delivery_status').eq('seller_id', sellerId);

    if (error) throw error;

    const counts: Record<string, number> = {
      processing: 0,
      shipped: 0,
      delivered: 0,
      returned: 0,
      total: data?.length || 0,
    };

    data?.forEach((order) => {
      const status = order.delivery_status || 'processing';
      counts[status] = (counts[status] || 0) + 1;
    });

    return { data: counts, error: null };
  }, 'getOrderCountsByStatus');
}

// Get count of orders pending fulfillment (processing or pending delivery status)
export async function getPendingOrderCount(sellerId: string): Promise<Result<number>> {
  return withErrorHandling(async () => {
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .in('delivery_status', ['processing', 'pending']);

    if (error) throw error;
    return { data: count || 0, error: null };
  }, 'getPendingOrderCount');
}

// Get admin-level count of orders by delivery status (all orders, not seller-specific)
export async function getAdminOrderCountByDeliveryStatus(deliveryStatus: string): Promise<Result<number>> {
  return withErrorHandling(async () => {
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('delivery_status', deliveryStatus);

    if (error) throw error;
    return { data: count || 0, error: null };
  }, 'getAdminOrderCountByDeliveryStatus');
}

// Fetch orders by stream ID
export async function fetchOrdersByStreamId(
  streamId: string,
  options: { status?: string; limit?: number } = {},
): Promise<Result<Array<{ id: string; order_amount: number; created_at: string; listing_id: string }>>> {
  return withErrorHandling(async () => {
    let query = supabase.from('orders').select('id, order_amount, created_at, listing_id').eq('stream_id', streamId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchOrdersByStreamId');
}
