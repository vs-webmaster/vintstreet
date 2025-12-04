import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye } from 'lucide-react';
import { AdminOrderDetailsModal } from '@/components/AdminOrderDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { fetchOrders } from '@/services/orders';
import { fetchProductByIdOrSlug } from '@/services/products';
import { fetchProfile } from '@/services/users';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  stream_id?: string | null;
  order_amount: number;
  quantity: number;
  status: string;
  delivery_status?: string | null;
  order_date: string;
  listings?: {
    product_name: string;
    thumbnail: string;
  } | null;
  buyer_profile?: {
    full_name: string;
    username: string;
  } | null;
  seller_profile?: {
    full_name: string;
    username: string;
  } | null;
}

const AdminOrdersPage = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const result = await fetchOrders({}, 1, 1000); // Fetch all orders
      if (isFailure(result)) throw result.error;

      // Enrich orders with profile and listing data
      const ordersWithRelations = await Promise.all(
        result.data.data.map(async (order) => {
          const [buyerProfileResult, sellerProfileResult, listingResult] = await Promise.all([
            fetchProfile(order.buyer_id),
            fetchProfile(order.seller_id),
            fetchProductByIdOrSlug(order.listing_id),
          ]);

          const buyerProfile = buyerProfileResult.success ? buyerProfileResult.data : null;
          const sellerProfile = sellerProfileResult.success ? sellerProfileResult.data : null;
          const listing = listingResult.success ? listingResult.data : null;

          return {
            ...order,
            buyer_profile: buyerProfile
              ? {
                  full_name: 'full_name' in buyerProfile ? buyerProfile.full_name : null,
                  username: 'username' in buyerProfile ? buyerProfile.username : null,
                }
              : null,
            seller_profile: sellerProfile
              ? {
                  full_name: 'full_name' in sellerProfile ? sellerProfile.full_name : null,
                  username: 'username' in sellerProfile ? sellerProfile.username : null,
                }
              : null,
            listings: listing
              ? {
                  product_name: listing.product_name,
                  thumbnail: listing.thumbnail,
                }
              : null,
          };
        }),
      );

      return ordersWithRelations;
    },
    enabled: !!user?.id,
  });

  const filteredOrders = orders.filter((order) => {
    const statusMatch = statusFilter === 'all' || (order.delivery_status || 'pending') === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      order.id.toLowerCase().includes(searchLower) ||
      order.buyer_profile?.full_name?.toLowerCase().includes(searchLower) ||
      order.seller_profile?.full_name?.toLowerCase().includes(searchLower) ||
      order.listings?.product_name?.toLowerCase().includes(searchLower);
    return statusMatch && searchMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'shipped':
        return 'bg-blue-500 text-white';
      case 'processing':
        return 'bg-yellow-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders Management</h1>
        </div>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Orders</h3>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="mb-6 flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({orders.length})
            </Button>
            <Button
              variant={statusFilter === 'processing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('processing')}
            >
              Processing ({orders.filter((o) => (o.delivery_status || 'pending') === 'processing').length})
            </Button>
            <Button
              variant={statusFilter === 'shipped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('shipped')}
            >
              Shipped ({orders.filter((o) => (o.delivery_status || 'pending') === 'shipped').length})
            </Button>
            <Button
              variant={statusFilter === 'delivered' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('delivered')}
            >
              Delivered ({orders.filter((o) => (o.delivery_status || 'pending') === 'delivered').length})
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.listings?.thumbnail && (
                            <img src={order.listings.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
                          )}
                          <span className="line-clamp-1">{order.listings?.product_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.buyer_profile?.full_name || order.buyer_profile?.username || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {order.seller_profile?.full_name || order.seller_profile?.username || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">£{Number(order.order_amount).toFixed(2)}</TableCell>
                      <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.delivery_status || 'pending')}>
                          {order.delivery_status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {selectedOrder && (
        <AdminOrderDetailsModal
          order={selectedOrder}
          isOpen={isOrderDetailsOpen}
          onClose={() => setIsOrderDetailsOpen(false)}
          onStatusUpdate={refetch}
        />
      )}
    </AdminLayout>
  );
};

export default AdminOrdersPage;
