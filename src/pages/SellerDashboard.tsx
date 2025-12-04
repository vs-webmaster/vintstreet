import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Video, Eye, Info } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import SellerSidebar from '@/components/SellerSidebar';
import SellerProfileForm from '@/components/SellerProfileForm';
import { FinancesTab } from '@/components/dashboard/FinancesTab';
import { MessagesTab } from '@/components/dashboard/MessagesTab';
import { MyShowTab } from '@/components/dashboard/MyShowTab';
import { OffersTab } from '@/components/dashboard/OffersTab';
import { OrdersTab } from '@/components/dashboard/OrdersTab';
import { ProductTemplates } from '@/components/ProductTemplates';
import { ReviewsTab } from '@/components/dashboard/ReviewsTab';
import { SetupTab } from '@/components/dashboard/SetupTab';
import { ShippingSettingsDialog } from '@/components/ShippingSettingsDialog';
import { StreamsTab } from '@/components/dashboard/StreamsTab';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useSellerStreams, useSellerOrders } from '@/hooks/useSellerData';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { getTabFromHash } from '@/lib/sellerTabUtils';
import { fetchShippingOptionsBySeller } from '@/services/shipping';
import { updateStreamStatus } from '@/services/streams';
import { isFailure } from '@/types/api';

const SellerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>('all');
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);

  // Check if seller has completed setup
  const { hasSellerProfile, loading: profileLoading } = useSellerProfile();

  // Get current tab from URL hash or default based on profile status
  const getDefaultTab = () => {
    if (!profileLoading && !hasSellerProfile) return 'setup';
    return 'products';
  };

  const currentTab = getTabFromHash(location.hash) || getDefaultTab();

  // Navigate to setup tab if setup is not complete
  useEffect(() => {
    if (!profileLoading && !hasSellerProfile && location.hash !== '#setup') {
      navigate('#setup', { replace: true });
    }
  }, [profileLoading, hasSellerProfile, location.hash, navigate]);

  // Use custom hooks for data fetching
  const { data: streams = [], isLoading: streamsLoading } = useSellerStreams();
  const { data: orders = [], isLoading: ordersLoading } = useSellerOrders();

  // Calculate stats using custom hook
  const stats = useDashboardStats(streams, orders);

  // Check if seller has shipping options set up
  const { data: shippingOptions = [] } = useQuery({
    queryKey: ['shipping-options', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await fetchShippingOptionsBySeller(user.id);
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  const hasShippingOptions = shippingOptions.length > 0;

  // Filter orders by stream
  const filteredOrders =
    selectedStreamFilter === 'all' ? orders : orders.filter((order) => order.stream_id === selectedStreamFilter);

  // Separate upcoming and previous streams
  const upcomingStreams = streams
    .filter((stream) => stream.status === 'scheduled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const previousStreams = streams
    .filter((stream) => stream.status === 'ended')
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const liveStream = streams.find((stream) => stream.status === 'live');
  const nextStream = upcomingStreams[0];

  const handleEndStream = async (streamId: string) => {
    try {
      const result = await updateStreamStatus(streamId, 'ended', new Date().toISOString());

      if (isFailure(result)) {
        throw result.error;
      }
      toast.success('Stream ended successfully!');
    } catch (error) {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {isMobile && <SellerSidebar />}

      <div className="flex flex-1">
        {!isMobile && <SellerSidebar forceCollapsed={!hasSellerProfile} />}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Tabs value={currentTab} className="w-full">
            {/* Hidden TabsList for accessibility */}
            <TabsList className="hidden">
              {!hasSellerProfile && <TabsTrigger value="setup">Setup</TabsTrigger>}
              <TabsTrigger value="products">My Listings</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="streams">My Streams</TabsTrigger>
              <TabsTrigger value="myshow">My Show</TabsTrigger>
              <TabsTrigger value="finances">Finances</TabsTrigger>
              <TabsTrigger value="settings">Shop Settings</TabsTrigger>
            </TabsList>

            {/* Setup Tab - Only shown if setup not complete */}
            {!hasSellerProfile && (
              <TabsContent value="setup" className="space-y-6">
                <SetupTab />
              </TabsContent>
            )}

            <TabsContent value="products" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">My Listings</h1>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" onClick={() => setIsShippingDialogOpen(true)} className="w-full sm:w-auto">
                    Shipping Settings
                  </Button>
                  <Button
                    onClick={() => navigate('/add-product')}
                    className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
                  >
                    Add Product
                  </Button>
                </div>
              </div>

              {/* Shipping options info banner */}
              {!hasShippingOptions && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Please{' '}
                    <button
                      onClick={() => setIsShippingDialogOpen(true)}
                      className="font-semibold underline hover:no-underline"
                    >
                      select shipping options
                    </button>{' '}
                    for your items to go live on the marketplace.
                  </AlertDescription>
                </Alert>
              )}

              <ProductTemplates />
            </TabsContent>

            <TabsContent value="streams" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">My Streams</h1>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" onClick={() => navigate('#myshow')} className="w-full sm:w-auto">
                    Design my Show
                  </Button>
                  <Link to="/schedule-stream">
                    <Button className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto">
                      <Video className="mr-2 h-4 w-4" />
                      Schedule Stream
                    </Button>
                  </Link>
                </div>
              </div>
              <StreamsTab
                upcomingStreams={upcomingStreams}
                liveStream={liveStream}
                previousStreams={previousStreams}
                onEndStream={handleEndStream}
                onRefresh={() => window.location.reload()}
              />
            </TabsContent>

            <TabsContent value="myshow" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">My Show</h1>
                  <p className="mt-1 text-muted-foreground">
                    Interactive templates to engage your live stream audience
                  </p>
                </div>
              </div>
              <MyShowTab />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Orders</h1>
                  <p className="mt-1 text-muted-foreground">Manage your customer orders and shipping</p>
                </div>
              </div>
              <OrdersTab />
            </TabsContent>

            <TabsContent value="offers" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Offers</h1>
                </div>
              </div>
              <OffersTab />
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Messages</h1>
                </div>
              </div>
              <MessagesTab />
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Reviews</h1>
                </div>
              </div>
              <ReviewsTab />
            </TabsContent>

            <TabsContent value="finances" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Finances</h1>
                </div>
              </div>
              <FinancesTab />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Shop Settings</h1>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to={`/seller/${user?.id}`}>
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Shop
                    </Button>
                  </Link>
                </div>
              </div>
              <SellerProfileForm />
            </TabsContent>
          </Tabs>

          {/* Shipping Settings Dialog */}
          <ShippingSettingsDialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen} />
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
