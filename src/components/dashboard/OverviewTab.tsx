import { ShoppingBag, DollarSign, TrendingUp, Video, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useSellerData';
import { Stream } from '@/types';
import { NextStreamCard } from './NextStreamCard';
import { StatCard } from './StatCard';

interface OverviewTabProps {
  streams: Stream[];
  orders: any[];
  streamsLoading: boolean;
  nextStream?: Stream;
}

export const OverviewTab = ({ streams, orders, streamsLoading, nextStream }: OverviewTabProps) => {
  const stats = useDashboardStats(streams, orders);

  if (streamsLoading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading streams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Stream & All Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Next Stream Countdown */}
        <NextStreamCard stream={nextStream} />

        {/* All Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Orders to Fulfill"
            value={stats.pendingOrders}
            icon={ShoppingBag}
            iconColor="text-orange-500"
            actionLabel="Fulfill Orders"
            actionHref="#orders"
          />

          <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingBag} />

          <StatCard title="Total Revenue" value={`£${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} />

          <StatCard title="Completed Streams" value={stats.completedStreams} icon={TrendingUp} />

          <StatCard
            title="Upcoming Streams"
            value={stats.upcomingStreamsCount}
            icon={Video}
            iconColor="text-blue-500"
          />

          <StatCard
            title="Total Viewers"
            value={stats.totalViewers.toLocaleString()}
            icon={Eye}
            iconColor="text-green-500"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Streams</h3>
          {streams.slice(0, 3).map((stream) => (
            <div key={stream.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="text-sm font-medium">{stream.title}</p>
                <p className="text-xs text-muted-foreground">
                  {stream.status === 'live' ? 'Currently Live' : stream.status === 'scheduled' ? 'Upcoming' : 'Ended'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{stream.viewer_count} viewers</p>
                <p className="text-xs text-muted-foreground">{stream.category}</p>
              </div>
            </div>
          ))}
          {streams.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No streams yet</p>}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Orders</h3>
          {orders.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="text-sm font-medium">Order #{order.id.slice(-8)}</p>
                <p className="text-xs text-muted-foreground">{order.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">£{Number(order.order_amount).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No orders yet</p>}
        </Card>
      </div>
    </div>
  );
};
