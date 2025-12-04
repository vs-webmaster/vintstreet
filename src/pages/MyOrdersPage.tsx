import { useState } from 'react';
import { Package, MessageCircle, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ContactSellerModal } from '@/components/ContactSellerModal';
import { WriteReviewModal } from '@/components/WriteReviewModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { fetchBuyerOrders } from '@/services/orders';
import { isFailure } from '@/types/api';

interface Order {
  id: string;
  listing_id: string;
  seller_id: string;
  order_amount: number;
  quantity: number;
  order_date: string;
  status: string;
  delivery_status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  listing?: {
    product_name: string;
    thumbnail: string | null;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'shipped':
      return 'bg-blue-100 text-blue-800';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface OrderCardProps {
  order: Order;
  onWriteReview: (orderId: string, sellerId: string, productName: string) => void;
  onContactSeller: (orderId: string, sellerId: string, productName: string) => void;
}

const OrderCard = ({ order, onWriteReview, onContactSeller }: OrderCardProps) => {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Image and Status - Mobile optimized */}
          <div className="flex gap-3 md:gap-4">
            <img
              src={
                order.listing?.thumbnail ||
                'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=150&h=150&fit=crop'
              }
              alt={order.listing?.product_name || 'Product'}
              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover md:h-20 md:w-20"
            />

            <div className="flex-1 md:hidden">
              <h3 className="line-clamp-2 text-base font-semibold">{order.listing?.product_name || 'Product'}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Order #{order.id.slice(-8)}</p>
              <Badge className={`${getStatusColor(order.delivery_status)} mt-2 inline-block`}>
                {order.delivery_status.charAt(0).toUpperCase() + order.delivery_status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Desktop content */}
          <div className="hidden flex-1 md:block">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{order.listing?.product_name || 'Product'}</h3>
                <p className="text-sm text-muted-foreground">Order #{order.id.slice(-8)}</p>
              </div>
              <Badge className={getStatusColor(order.delivery_status)}>
                {order.delivery_status.charAt(0).toUpperCase() + order.delivery_status.slice(1)}
              </Badge>
            </div>

            <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Qty: {order.quantity}</span>
              <span>•</span>
              <span>£{Number(order.order_amount).toFixed(2)}</span>
              <span>•</span>
              <span>Ordered {new Date(order.order_date).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              {order.delivery_status === 'delivered' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onWriteReview(order.id, order.seller_id, order.listing?.product_name || 'Product')}
                >
                  <Star className="h-4 w-4" />
                  Write Review
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => onContactSeller(order.id, order.seller_id, order.listing?.product_name || 'Product')}
              >
                <MessageCircle className="h-4 w-4" />
                Contact Seller
              </Button>
            </div>
          </div>

          {/* Mobile details and actions */}
          <div className="space-y-3 md:hidden">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium">Qty: {order.quantity}</span>
              <span>•</span>
              <span className="font-medium">£{Number(order.order_amount).toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Ordered {new Date(order.order_date).toLocaleDateString()}</p>

            <div className="flex flex-col gap-2">
              {order.delivery_status === 'delivered' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => onWriteReview(order.id, order.seller_id, order.listing?.product_name || 'Product')}
                >
                  <Star className="h-4 w-4" />
                  Write Review
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => onContactSeller(order.id, order.seller_id, order.listing?.product_name || 'Product')}
              >
                <MessageCircle className="h-4 w-4" />
                Contact Seller
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    orderId: string;
    sellerId: string;
    productName: string;
  }>({
    isOpen: false,
    orderId: '',
    sellerId: '',
    productName: '',
  });
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    orderId: string;
    sellerId: string;
    productName: string;
  }>({
    isOpen: false,
    orderId: '',
    sellerId: '',
    productName: '',
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['buyer-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const result = await fetchBuyerOrders(user.id, 1, 1000);

      if (isFailure(result)) {
        throw result.error;
      }

      // Transform orders to match the expected format
      const ordersWithListings = result.data.data.map((order: unknown) => {
        const listing = order.listings;
        return {
          id: order.id,
          listing_id: order.listing_id,
          seller_id: order.seller_id,
          order_amount: order.order_amount,
          quantity: order.quantity,
          order_date: order.order_date || order.created_at,
          status: order.status,
          delivery_status: order.delivery_status,
          listing: listing
            ? {
                product_name: listing.product_name,
                thumbnail: listing.thumbnail,
              }
            : undefined,
        };
      });

      return ordersWithListings as Order[];
    },
    enabled: !!user,
  });

  const filterOrders = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter((order) => order.delivery_status === status);
  };

  const filteredOrders = filterOrders(activeTab);
  const orderCounts = {
    all: orders.length,
    processing: orders.filter((o) => o.delivery_status === 'processing').length,
    shipped: orders.filter((o) => o.delivery_status === 'shipped').length,
    delivered: orders.filter((o) => o.delivery_status === 'delivered').length,
    cancelled: orders.filter((o) => o.delivery_status === 'cancelled').length,
  };

  const handleWriteReview = (orderId: string, sellerId: string, productName: string) => {
    setReviewModal({ isOpen: true, orderId, sellerId, productName });
  };

  const handleContactSeller = (orderId: string, sellerId: string, productName: string) => {
    setContactModal({ isOpen: true, orderId, sellerId, productName });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-auto md:grid md:w-full md:max-w-2xl md:grid-cols-5">
              <TabsTrigger value="all" className="flex-shrink-0 gap-2 whitespace-nowrap">
                All Orders
                <Badge variant="secondary">{orderCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex-shrink-0 gap-2 whitespace-nowrap">
                Processing
                {orderCounts.processing > 0 && <Badge variant="secondary">{orderCounts.processing}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="shipped" className="flex-shrink-0 gap-2 whitespace-nowrap">
                Shipped
                {orderCounts.shipped > 0 && <Badge variant="secondary">{orderCounts.shipped}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="delivered" className="flex-shrink-0 gap-2 whitespace-nowrap">
                Delivered
                {orderCounts.delivered > 0 && <Badge variant="secondary">{orderCounts.delivered}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex-shrink-0 gap-2 whitespace-nowrap">
                Cancelled
                {orderCounts.cancelled > 0 && <Badge variant="secondary">{orderCounts.cancelled}</Badge>}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-8">
            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onWriteReview={handleWriteReview}
                    onContactSeller={handleContactSeller}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No orders found</h3>
                <p className="mb-6 text-muted-foreground">
                  {activeTab === 'all' ? "You haven't placed any orders yet" : `No ${activeTab} orders found`}
                </p>
                <Button onClick={() => (window.location.href = '/shop')}>Start Shopping</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <WriteReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        orderId={reviewModal.orderId}
        sellerId={reviewModal.sellerId}
        productName={reviewModal.productName}
      />

      <ContactSellerModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ ...contactModal, isOpen: false })}
        sellerId={contactModal.sellerId}
        sellerName="Seller"
        productName={contactModal.productName}
        orderId={contactModal.orderId}
      />
      <Footer />
    </div>
  );
};

export default MyOrdersPage;
