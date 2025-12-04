import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Heart, Star } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { fetchFollowing, unfollowById } from '@/services/follows';
import { fetchBuyerOrders } from '@/services/orders';
import { fetchProfilesByUserIds } from '@/services/users';
import { isFailure } from '@/types/api';

interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  stream_id: string;
  order_amount: number;
  quantity: number;
  status: string;
  order_date: string;
  created_at: string;
}

interface Follow {
  id: string;
  follower_id: string;
  followed_user_id: string;
  created_at: string;
  profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    user_type?: string;
    user_id: string;
  } | null;
}

const BuyerDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [orderFilter, setOrderFilter] = useState('all');

  // Fetch buyer's orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['buyer-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await fetchBuyerOrders(user.id, 1, 1000);

      if (isFailure(result)) {
        console.error('Error fetching orders:', result.error);
        return [];
      }

      return result.data.data as Order[];
    },
    enabled: !!user?.id,
  });

  // Fetch user's follows
  const { data: follows = [], isLoading: followsLoading } = useQuery({
    queryKey: ['user-follows', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const followResult = await fetchFollowing(user.id);

      if (isFailure(followResult)) {
        console.error('Error fetching follows:', followResult.error);
        return [];
      }

      const followData = followResult.data;

      // Fetch profile data for followed users
      if (followData && followData.length > 0) {
        const followedUserIds = followData.map((f) => f.followed_user_id);
        const profileResult = await fetchProfilesByUserIds(followedUserIds);

        if (isFailure(profileResult)) {
          console.error('Error fetching profiles:', profileResult.error);
          return followData.map((follow) => ({ ...follow, profile: null })) as Follow[];
        }

        const profileData = profileResult.data;

        // Combine follow data with profile data
        return followData.map((follow) => {
          const profile = profileData?.find((p) => p.user_id === follow.followed_user_id);
          return {
            ...follow,
            profile: profile
              ? {
                  user_id: profile.user_id,
                  username: profile.username,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url,
                  user_type: profile.user_type,
                }
              : null,
          };
        }) as Follow[];
      }

      return (followData?.map((follow) => ({ ...follow, profile: null })) as Follow[]) || [];
    },
    enabled: !!user?.id,
  });

  // Function to unfollow a user
  const handleUnfollow = async (followId: string, followedUserId: string) => {
    try {
      const result = await unfollowById(followId);

      if (isFailure(result)) {
        throw result.error;
      }

      toast.success('Unfollowed successfully!');
      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ['user-follows', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-follows-homepage', user?.id] });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    }
  };

  // Filter orders by status
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((order) => order.status === orderFilter);

  // Calculate stats
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.order_amount), 0);
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const completedOrders = orders.filter((order) => order.status === 'completed').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'shipped':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Dashboard header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center lg:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">My Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track your orders and manage your shopping</p>
          </div>
        </div>

        {/* Tabs moved to top */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Stats overview */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mb-8 lg:grid-cols-4 lg:gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">${totalSpent.toFixed(2)}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-foreground">{pendingOrders}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Following</p>
                  <p className="text-2xl font-bold text-foreground">{follows.length}</p>
                </div>
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
          </div>

          <TabsContent value="orders" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Order History</h3>
                <div className="flex items-center gap-4">
                  <Select value={orderFilter} onValueChange={setOrderFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {ordersLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {orderFilter === 'all' ? 'No orders yet' : `No ${orderFilter} orders`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start shopping from live streams to see your orders here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
                            <Badge className={getStatusColor(order.status)} variant="secondary">
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Quantity: {order.quantity}</div>
                            <div>Date: {new Date(order.order_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold">${Number(order.order_amount).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.order_date).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="following" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-6 text-lg font-semibold text-foreground">Following</h3>

              {followsLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading...</p>
                </div>
              ) : follows.length === 0 ? (
                <div className="py-8 text-center">
                  <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">You're not following anyone yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Follow sellers to get notified when they go live</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {follows.map((follow) => (
                    <div key={follow.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center">
                        <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          {follow.profile?.avatar_url ? (
                            <img
                              src={follow.profile.avatar_url}
                              alt="Profile"
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="font-semibold text-primary">
                              {follow.profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {follow.profile?.full_name ||
                              follow.profile?.username ||
                              `User ${follow.followed_user_id.slice(0, 8)}`}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {follow.profile?.user_type || 'buyer'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Following since {new Date(follow.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(follow.id, follow.followed_user_id)}
                      >
                        Unfollow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Wishlist</h3>
              <div className="py-8 text-center">
                <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Wishlist feature coming soon</p>
                <p className="mt-1 text-sm text-muted-foreground">Save items you love for later</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Account Settings</h3>
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Settings panel coming soon</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BuyerDashboard;
