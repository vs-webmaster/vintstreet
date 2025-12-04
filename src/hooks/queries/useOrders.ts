// Order Query Hooks
// React Query hooks for order data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOrders,
  fetchOrderById,
  fetchBuyerOrders,
  fetchSellerOrders,
  createOrder,
  updateOrder,
  updateOrderStatus,
  updateDeliveryStatus,
  confirmOrderReceived,
  reportOrderIssue,
  getOrderCountsByStatus,
  type OrderFilters,
  type CreateOrderInput,
  type UpdateOrderInput,
} from '@/services/orders';
import { isSuccess } from '@/types/api';

// Query key factory for orders
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  buyer: (buyerId: string) => [...orderKeys.all, 'buyer', buyerId] as const,
  seller: (sellerId: string, filters?: Omit<OrderFilters, 'sellerId'>) =>
    [...orderKeys.all, 'seller', sellerId, filters] as const,
  counts: (sellerId: string) => [...orderKeys.all, 'counts', sellerId] as const,
};

// Hook to fetch orders with filters
export function useOrders(filters: OrderFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...orderKeys.list(filters), page, pageSize],
    queryFn: async () => {
      const result = await fetchOrders(filters, page, pageSize);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to fetch a single order
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(orderId || ''),
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID required');
      const result = await fetchOrderById(orderId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!orderId,
    staleTime: 1000 * 60 * 2,
  });
}

// Hook to fetch buyer's orders
export function useBuyerOrders(buyerId: string | undefined, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...orderKeys.buyer(buyerId || ''), page, pageSize],
    queryFn: async () => {
      if (!buyerId) return { data: [], totalCount: 0 };
      const result = await fetchBuyerOrders(buyerId, page, pageSize);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!buyerId,
    staleTime: 1000 * 60 * 2,
  });
}

// Hook to fetch seller's orders
export function useSellerOrders(
  sellerId: string | undefined,
  filters: Omit<OrderFilters, 'sellerId'> = {},
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: [...orderKeys.seller(sellerId || '', filters), page, pageSize],
    queryFn: async () => {
      if (!sellerId) return { data: [], totalCount: 0 };
      const result = await fetchSellerOrders(sellerId, filters, page, pageSize);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 2,
  });
}

// Hook to fetch order counts by status
export function useOrderCounts(sellerId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.counts(sellerId || ''),
    queryFn: async () => {
      if (!sellerId) return { processing: 0, shipped: 0, delivered: 0, returned: 0, total: 0 };
      const result = await getOrderCountsByStatus(sellerId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 2,
  });
}

// Mutation hook to create an order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const result = await createOrder(input);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

// Mutation hook to update an order
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: UpdateOrderInput }) => {
      const result = await updateOrder(orderId, updates);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

// Mutation hook to update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const result = await updateOrderStatus(orderId, status);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

// Mutation hook to update delivery status
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      deliveryStatus,
      trackingNumber,
    }: {
      orderId: string;
      deliveryStatus: string;
      trackingNumber?: string;
    }) => {
      const result = await updateDeliveryStatus(orderId, deliveryStatus, trackingNumber);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

// Mutation hook to confirm order received
export function useConfirmOrderReceived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const result = await confirmOrderReceived(orderId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

// Mutation hook to report an issue
export function useReportOrderIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, description }: { orderId: string; description: string }) => {
      const result = await reportOrderIssue(orderId, description);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
