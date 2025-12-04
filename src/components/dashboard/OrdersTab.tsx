import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Printer, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { ContactModal } from '@/components/ContactModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useShippingLabel } from '@/hooks/useShippingLabel';
import { useSellerFees, calculateSellerFee } from '@/hooks/useSellerFees';
import { fetchSellerOrders } from '@/services/orders';
import { fetchProfilesByUserIds, fetchBuyerProfilesByUserIds } from '@/services/users';
import { isFailure } from '@/types/api';

interface OrderDetails {
  id: string;
  orderNumber: string;
  product: {
    name: string;
    thumbnail: string;
    price: number;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    shippingAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  quantity: number;
  totalAmount: number;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  shippingMethod: string;
  estimatedDelivery?: string;
}

export const OrdersTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { generateLabel, isGenerating } = useShippingLabel();
  const { data: sellerFees } = useSellerFees();
  const [statusFilter, setStatusFilter] = useState<string>('processing');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<OrderDetails | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageBuyerId, setMessageBuyerId] = useState<string>('');
  const [messageBuyerName, setMessageBuyerName] = useState<string>('');
  const [messageOrderId, setMessageOrderId] = useState<string>('');

  // Fetch orders from database
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['seller-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch orders using OrderService
      const ordersResult = await fetchSellerOrders(user.id, {}, 1, 1000); // Fetch all orders
      if (isFailure(ordersResult)) {
        throw ordersResult.error;
      }

      const ordersData = ordersResult.data.data || [];
      if (ordersData.length === 0) return [];

      // Extract buyer IDs
      const buyerIds = [...new Set(ordersData.map((o) => o.buyer_id))];

      // Fetch buyer profiles and buyer profile details in parallel
      const [profilesResult, buyerProfilesResult] = await Promise.all([
        fetchProfilesByUserIds(buyerIds),
        fetchBuyerProfilesByUserIds(buyerIds),
      ]);

      if (isFailure(profilesResult) || isFailure(buyerProfilesResult)) {
        throw new Error('Failed to fetch buyer information');
      }

      const profilesData = profilesResult.data || [];
      const buyerProfilesData = buyerProfilesResult.data || [];

      // Create lookup maps for faster access
      const profileMap = new Map(profilesData.map((p) => [p.user_id, p]));
      const buyerProfileMap = new Map(buyerProfilesData.map((b) => [b.user_id, b]));

      // Map to OrderDetails format - filter out any orders without listings
      const mappedOrders: OrderDetails[] = ordersData
        .map((order) => {
          const listing = (order as unknown).listings;

          // Skip orders without listing data
          if (!listing) return null;

          const profile = profileMap.get(order.buyer_id);
          const buyerProfile = buyerProfileMap.get(order.buyer_id);

          return {
            id: order.id,
            orderNumber: `ORD-${order.id.slice(-8).toUpperCase()}`,
            product: {
              name: listing.product_name || 'Unknown Product',
              thumbnail: listing.thumbnail || '/placeholder.svg',
              price: Number(order.order_amount) / order.quantity,
            },
            buyer: {
              id: order.buyer_id,
              name: profile?.full_name || profile?.username || 'Unknown User',
              email: '',
              phone: buyerProfile?.shipping_phone || buyerProfile?.billing_phone || '',
              avatar:
                profile?.avatar_url ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
              shippingAddress: {
                line1: buyerProfile?.shipping_address_line1 || '',
                line2: buyerProfile?.shipping_address_line2,
                city: buyerProfile?.shipping_city || '',
                state: buyerProfile?.shipping_state || '',
                postalCode: buyerProfile?.shipping_postal_code || '',
                country: buyerProfile?.shipping_country || 'UK',
              },
            },
            quantity: order.quantity,
            totalAmount: Number(order.order_amount),
            orderDate: (order as unknown).order_date || order.created_at,
            status: order.delivery_status as unknown,
            trackingNumber: order.tracking_number || undefined,
            shippingMethod: 'Standard Shipping',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          };
        })
        .filter((order) => order !== null) as OrderDetails[];

      return mappedOrders;
    },
    enabled: !!user?.id,
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    toast.success(`Order status updated to ${newStatus}`);
  };

  const handlePrintLabel = async (order: OrderDetails) => {
    try {
      const result = await generateLabel(order.id);
      if (result?.success) {
        // Refetch orders to get updated tracking number
        queryClient.invalidateQueries({ queryKey: ['seller-orders', user?.id] });
        toast.success(
          `Shipping label generated for order ${order.orderNumber}${
            result.tracking_number ? ` - Tracking: ${result.tracking_number}` : ''
          }`,
        );
      }
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error(`Failed to generate shipping label for order ${order.orderNumber}`);
    }
  };

  const handleViewDetails = (order: OrderDetails) => {
    setSelectedOrderForDetails(order);
    setOrderDetailsModalOpen(true);
  };

  const handleMessageBuyer = () => {
    if (selectedOrderForDetails) {
      setMessageBuyerId(selectedOrderForDetails.buyer.id);
      setMessageBuyerName(selectedOrderForDetails.buyer.name);
      setMessageOrderId(selectedOrderForDetails.id);
      setMessageModalOpen(true);
    }
  };

  const handleStatusUpdated = () => {
    // Refetch orders after status update
    window.location.reload();
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders((prev) => [...prev, orderId]);
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkPrintLabels = () => {
    const selectedOrdersData = filteredOrders.filter((order) => selectedOrders.includes(order.id));
    toast.success(`Printing ${selectedOrdersData.length} shipping labels`);
    // Clear selection after printing
    setSelectedOrders([]);
  };

  const exportToExcel = (status: string = 'all') => {
    const filteredOrders = status === 'all' ? orders : orders.filter((order) => order.status === status);

    const exportData = filteredOrders.map((order) => ({
      'Order Number': order.orderNumber,
      'Customer Name': order.buyer?.name || 'Unknown',
      'Customer Email': order.buyer?.email || '',
      'Customer Phone': order.buyer?.phone || '',
      Product: order.product?.name || 'Unknown',
      Quantity: order.quantity || 0,
      'Total Amount': `£${(order.totalAmount || 0).toFixed(2)}`,
      Status: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown',
      'Order Date': new Date(order.orderDate).toLocaleDateString(),
      'Shipping Method': order.shippingMethod || 'Standard',
      'Tracking Number': order.trackingNumber || '',
      'Shipping Address': order.buyer?.shippingAddress
        ? `${order.buyer.shippingAddress.line1}, ${order.buyer.shippingAddress.city}, ${order.buyer.shippingAddress.postalCode}`
        : 'N/A',
      'Estimated Delivery': order.estimatedDelivery || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Orders-${status === 'all' ? 'All' : status}`);

    const filename = `orders-${status === 'all' ? 'all' : status}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    toast.success(`Exported ${filteredOrders.length} orders to ${filename}`);
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter((order) => order.status === statusFilter);

  // Calculate counts for each status
  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  // Auto-switch to 'all' if no processing orders
  useEffect(() => {
    if (!isLoading && orders.length > 0 && processingCount === 0 && statusFilter === 'processing') {
      setStatusFilter('all');
    }
  }, [isLoading, orders.length, processingCount, statusFilter]);

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  const allSelected = filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length;
  const someSelected = selectedOrders.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with Filter Buttons */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg bg-muted/30 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={statusFilter === 'processing' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('processing')}
            size="sm"
          >
            Orders To Fulfil {processingCount > 0 && `(${processingCount})`}
          </Button>
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All Orders {orders.length > 0 && `(${orders.length})`}
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('pending')}
            size="sm"
          >
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </Button>
          <Button
            variant={statusFilter === 'shipped' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('shipped')}
            size="sm"
          >
            Shipped {shippedCount > 0 && `(${shippedCount})`}
          </Button>
          <Button
            variant={statusFilter === 'delivered' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('delivered')}
            size="sm"
          >
            Delivered {deliveredCount > 0 && `(${deliveredCount})`}
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('cancelled')}
            size="sm"
          >
            Cancelled {cancelledCount > 0 && `(${cancelledCount})`}
          </Button>
        </div>

        <div className="flex space-x-2">
          {someSelected && (
            <Button variant="default" onClick={handleBulkPrintLabels} className="flex items-center space-x-2">
              <Printer className="h-4 w-4" />
              <span>Print {selectedOrders.length} Labels</span>
            </Button>
          )}
          <Button variant="outline" onClick={() => exportToExcel(statusFilter)} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Column Headers - Hidden on mobile */}
      {filteredOrders.length > 0 && (
        <div className="hidden grid-cols-12 items-center gap-4 rounded-lg bg-muted/20 px-4 py-3 text-sm font-medium lg:grid">
          <div className="col-span-1 flex justify-center">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
          </div>
          <div className="col-span-2 text-center">Image</div>
          <div className="col-span-2 text-center lg:text-left">Order Date</div>
          <div className="col-span-2 text-center lg:text-left">Price</div>
          <div className="col-span-1 text-center lg:text-left">Quantity</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center lg:text-right">Actions</div>
        </div>
      )}

      {/* Orders Table */}
      <div className="space-y-2">
        {filteredOrders.map((order) => {
          const isSelected = selectedOrders.includes(order.id);

          return (
            <Card
              key={order.id}
              className={`p-4 transition-colors ${isSelected ? 'border-primary/20 bg-primary/5' : ''}`}
            >
              {/* Mobile Layout */}
              <div className="space-y-4 lg:hidden">
                {/* Header with checkbox and image */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    className="mt-1 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <img
                    src={order.product?.thumbnail || '/placeholder.svg'}
                    alt={order.product?.name || 'Product'}
                    className="h-20 w-20 flex-shrink-0 rounded border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold">{order.product?.name || 'Product'}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{order.orderNumber}</p>
                    <Badge
                      className={`mt-2 ${
                        order.status === 'delivered'
                          ? 'bg-green-500'
                          : order.status === 'shipped'
                            ? 'bg-blue-500'
                            : order.status === 'processing'
                              ? 'bg-yellow-500'
                              : order.status === 'cancelled'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                      }`}
                    >
                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                    </Badge>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-2 pl-9 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium">£{(order.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="font-medium">{order.quantity || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">You Receive</p>
                    {(() => {
                      const sellerFee = calculateSellerFee(order.totalAmount || 0, sellerFees, 'marketplace');
                      const netAmount =
                        sellerFee !== null ? (order.totalAmount || 0) - sellerFee : order.totalAmount || 0;
                      return (
                        <div>
                          <p className="font-medium text-green-600">£{netAmount.toFixed(2)}</p>
                          {sellerFee !== null && (
                            <p className="text-xs text-muted-foreground">Fee: £{sellerFee.toFixed(2)}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions */}
                <div className="pl-9">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(order)}
                    className="flex w-full items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </Button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden grid-cols-12 items-center gap-4 lg:grid">
                {/* Selection Checkbox */}
                <div className="col-span-1 flex justify-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                </div>

                {/* Product Image */}
                <div className="col-span-2 flex justify-center">
                  <img
                    src={order.product?.thumbnail || '/placeholder.svg'}
                    alt={order.product?.name || 'Product'}
                    className="h-20 w-20 rounded border object-cover"
                  />
                </div>

                {/* Order Date */}
                <div className="col-span-2 text-left">
                  <p className="text-sm font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</p>
                </div>

                {/* Price */}
                <div className="col-span-2 text-left">
                  <p className="text-sm font-medium">£{(order.totalAmount || 0).toFixed(2)}</p>
                  {(() => {
                    const sellerFee = calculateSellerFee(order.totalAmount || 0, sellerFees, 'marketplace');
                    const netAmount =
                      sellerFee !== null ? (order.totalAmount || 0) - sellerFee : order.totalAmount || 0;
                    return (
                      <div className="mt-1">
                        <p className="text-xs text-green-600">You receive: £{netAmount.toFixed(2)}</p>
                        {sellerFee !== null && (
                          <p className="text-xs text-muted-foreground">Fee: £{sellerFee.toFixed(2)}</p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Quantity */}
                <div className="col-span-1 text-left">
                  <p className="text-sm">{order.quantity || 0}</p>
                </div>

                {/* Status - Read Only */}
                <div className="col-span-2 flex justify-center">
                  <Badge
                    className={`${
                      order.status === 'delivered'
                        ? 'bg-green-500'
                        : order.status === 'shipped'
                          ? 'bg-blue-500'
                          : order.status === 'processing'
                            ? 'bg-yellow-500'
                            : order.status === 'cancelled'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                    }`}
                  >
                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(order)}
                    className="flex h-8 items-center space-x-1 px-3 py-1 text-xs"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Details</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="py-12 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
          </h3>
          <p className="text-muted-foreground">
            {statusFilter === 'all'
              ? 'Orders from your live streams will appear here'
              : `No orders with ${statusFilter} status found`}
          </p>
        </div>
      )}

      {selectedOrderForDetails && (
        <>
          <OrderDetailsModal
            isOpen={orderDetailsModalOpen}
            onClose={() => setOrderDetailsModalOpen(false)}
            order={selectedOrderForDetails}
            onMessageBuyer={handleMessageBuyer}
            onStatusUpdate={handleStatusUpdated}
          />

          <ContactModal
            isOpen={messageModalOpen}
            onClose={() => setMessageModalOpen(false)}
            recipientId={messageBuyerId}
            recipientName={messageBuyerName}
            productName={selectedOrderForDetails?.product?.name || ''}
            orderId={messageOrderId}
            mode="seller"
          />
        </>
      )}
    </div>
  );
};
