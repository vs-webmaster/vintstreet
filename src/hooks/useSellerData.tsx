import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchSellerOrders } from '@/services/orders';
import { fetchActiveStreamCategories, fetchStreamsByUserId } from '@/services/streams';
import { isFailure } from '@/types/api';
import { Stream, Order, DashboardStats } from '@/types';

export const useSellerStreams = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['seller-streams', user?.id],
    queryFn: async () => {
      const result = await fetchStreamsByUserId(user?.id);

      if (isFailure(result)) {
        console.error('Error fetching streams:', result.error);
        return [];
      }

      return result.data as Stream[];
    },
    enabled: !!user?.id,
  });
};

export const useSellerOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['seller-orders', user?.id],
    queryFn: async () => {
      const result = await fetchSellerOrders(user?.id, {}, 1, 1000);

      if (isFailure(result)) {
        console.error('Error fetching orders:', result.error);
        return [];
      }

      return result.data.data as Order[];
    },
    enabled: !!user?.id,
  });
};

export const useDashboardStats = (streams: Stream[], orders: Order[]): DashboardStats => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.order_amount), 0);
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;

  const upcomingStreams = streams.filter((stream) => stream.status === 'scheduled');
  const previousStreams = streams.filter((stream) => stream.status === 'ended');

  const totalViewers = streams.reduce((sum, stream) => sum + stream.viewer_count, 0);
  const completedStreams = previousStreams.length;
  const upcomingStreamsCount = upcomingStreams.length;

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    completedStreams,
    upcomingStreamsCount,
    totalViewers,
  };
};

export const useStreamCategories = () => {
  return useQuery({
    queryKey: ['stream-categories'],
    queryFn: async () => {
      const result = await fetchActiveStreamCategories();

      if (isFailure(result)) {
        console.error('Error fetching categories:', result.error);
        return [];
      }

      return result.data;
    },
  });
};
