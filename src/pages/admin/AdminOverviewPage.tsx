import { Users, ShoppingBag, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AlgoliaSyncManager } from '@/components/admin/AlgoliaSyncManager';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { fetchAllOrdersMinimal } from '@/services/orders';
import { fetchAllProfiles } from '@/services/users';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

const AdminOverviewPage = () => {
  const { user } = useAuth();

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['admin-overview-users'],
    queryFn: async () => {
      const result = await fetchAllProfiles();
      if (isFailure(result)) throw result.error;

      const profiles = result.data;
      const buyers = profiles?.filter((p) => p.user_type === 'buyer').length || 0;
      const sellers = profiles?.filter((p) => p.user_type === 'seller').length || 0;

      return {
        total: profiles?.length || 0,
        buyers,
        sellers,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch orders and revenue
  const { data: orderStats } = useQuery({
    queryKey: ['admin-overview-orders'],
    queryFn: async () => {
      const result = await fetchAllOrdersMinimal();
      if (isFailure(result)) throw result.error;

      const orders = result.data;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.order_amount), 0) || 0;
      const pendingOrders = orders?.filter((o) => o.delivery_status === 'processing').length || 0;

      return {
        total: orders?.length || 0,
        totalRevenue,
        pendingOrders,
        avgOrderValue: orders && orders.length > 0 ? totalRevenue / orders.length : 0,
      };
    },
    enabled: !!user?.id,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard Overview</h1>
        </div>

        <AlgoliaSyncManager />

        {/* User Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{userStats?.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Buyers</p>
                <p className="text-2xl font-bold text-foreground">{userStats?.buyers || 0}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sellers</p>
                <p className="text-2xl font-bold text-foreground">{userStats?.sellers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">£{orderStats?.totalRevenue.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Financial Metrics */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">Financial Overview</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{orderStats?.total || 0}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    £{orderStats?.avgOrderValue.toFixed(2) || '0.00'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Platform Fees (10%)</p>
                  <p className="text-2xl font-bold text-foreground">
                    £{((orderStats?.totalRevenue || 0) * 0.1).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Seller Earnings (90%)</p>
                  <p className="text-2xl font-bold text-foreground">
                    £{((orderStats?.totalRevenue || 0) * 0.9).toFixed(2)}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverviewPage;
