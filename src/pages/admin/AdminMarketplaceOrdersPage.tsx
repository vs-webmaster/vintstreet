import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchOrders } from '@/services/orders';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

export default function AdminMarketplaceOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-marketplace-orders'],
    queryFn: async () => {
      const result = await fetchOrders({}, 1, 1000);
      if (isFailure(result)) throw result.error;

      // Note: The orders service returns orders with buyer/seller profiles already included
      // If we need buyer profile specifically, we may need to enrich the data
      return result.data.data || [];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Orders</h1>
          <p className="text-muted-foreground">Orders from individual sellers on the marketplace</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Marketplace Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders && orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.profiles?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{order.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>${order.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.delivery_status === 'delivered'
                              ? 'default'
                              : order.delivery_status === 'processing'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {order.delivery_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No marketplace orders found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
