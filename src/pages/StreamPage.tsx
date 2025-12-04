import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Plus, CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import BiddingSection from '@/components/BiddingSection';
import LiveChat from '@/components/LiveChat';
import ListingManager from '@/components/ListingManager';
import { PaymentInfoDialog } from '@/components/PaymentInfoDialog';
import SellerModeConverter from '@/components/SellerModeConverter';
import StreamPlayer from '@/components/StreamPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { checkFollowStatus, followUser, unfollowUser, fetchFollowers } from '@/services/follows';
import { fetchProductsBySeller } from '@/services/products';
import { fetchStreamByIdPublic } from '@/services/streams';
import { fetchProfile, fetchSellerProfile } from '@/services/users';
import { isFailure } from '@/types/api';

const StreamPage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentNotification, setShowPaymentNotification] = useState(false);
  const queryClient = useQueryClient();

  // Show payment notification constantly for testing
  useEffect(() => {
    setShowPaymentNotification(true);
  }, []);

  // Fetch stream data from Supabase
  const {
    data: streamData,
    isLoading: isLoadingStream,
    error: streamError,
  } = useQuery({
    queryKey: ['stream', id],
    queryFn: async () => {
      if (!id) throw new Error('Stream ID is required');

      const streamResult = await fetchStreamByIdPublic(id);
      if (isFailure(streamResult)) throw streamResult.error;
      const stream = streamResult.data;
      if (!stream) throw new Error('Stream not found');

      // Fetch seller profile data
      const [sellerProfileResult, userProfileResult] = await Promise.all([
        fetchSellerProfile(stream.seller_id),
        fetchProfile(stream.seller_id),
      ]);

      const sellerProfile = sellerProfileResult.success ? sellerProfileResult.data : null;
      const userProfile = userProfileResult.success ? userProfileResult.data : null;

      const streamerName =
        (sellerProfile && ('shop_name' in sellerProfile ? sellerProfile.shop_name : null)) ||
        (sellerProfile && ('business_name' in sellerProfile ? sellerProfile.business_name : null)) ||
        (userProfile && ('full_name' in userProfile ? userProfile.full_name : null)) ||
        (userProfile && ('username' in userProfile ? userProfile.username : null)) ||
        'Unknown Seller';

      return {
        id: stream.id,
        streamerId: stream.seller_id,
        title: stream.title,
        streamerName,
        streamerAvatar:
          (userProfile && ('avatar_url' in userProfile ? userProfile.avatar_url : null)) ||
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        isLive: stream.status === 'live',
        viewerCount: stream.viewer_count || 0,
        description: stream.description || '',
        category: stream.category,
        thumbnail: stream.thumbnail,
        startTime: stream.start_time,
        endTime: stream.end_time,
        status: stream.status,
        duration: stream.duration,
        timezone: stream.timezone,
      };
    },
    enabled: !!id,
  });

  // Fetch real products for this seller
  const { data: products = [] } = useQuery({
    queryKey: ['seller-products', streamData?.streamerId],
    queryFn: async () => {
      if (!streamData?.streamerId) return [];

      const result = await fetchProductsBySeller(streamData.streamerId);
      if (isFailure(result)) {
        console.error('Error fetching products:', result.error);
        return [];
      }

      return result.data.map((listing: unknown) => ({
        id: listing.id,
        name: listing.product_name,
        price: `£${listing.starting_price}`,
        originalPrice: null, // Could be calculated if you have original price field
        image: listing.thumbnail || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200&h=200&fit=crop',
        inStock: true,
        discount: null,
      }));
    },
    enabled: !!streamData?.streamerId,
  });

  const isStreamer = profile?.user_type === 'seller' && user?.id === streamData?.streamerId;

  // Check if user is following this seller
  const { data: isFollowing = false } = useQuery({
    queryKey: ['is-following', user?.id, streamData?.streamerId],
    queryFn: async () => {
      if (!user?.id || !streamData?.streamerId) return false;

      const result = await checkFollowStatus(user.id, streamData.streamerId);
      if (isFailure(result)) {
        console.error('Error checking follow status:', result.error);
        return false;
      }

      return !!result.data;
    },
    enabled: !!user?.id && !!streamData?.streamerId,
  });

  // Get real follower count and profile data
  const { data: sellerData } = useQuery({
    queryKey: ['seller-data', streamData?.streamerId],
    queryFn: async () => {
      if (!streamData?.streamerId) return null;

      const [followersResult, profileResult] = await Promise.all([
        fetchFollowers(streamData.streamerId),
        fetchProfile(streamData.streamerId),
      ]);

      return {
        followerCount: followersResult.success ? followersResult.data.length : 0,
        profile: profileResult.success ? profileResult.data : null,
      };
    },
    enabled: !!streamData?.streamerId,
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (shouldFollow: boolean) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!streamData?.streamerId) throw new Error('Stream data not available');

      if (shouldFollow) {
        const result = await followUser(user.id, streamData.streamerId);
        if (isFailure(result)) throw result.error;
      } else {
        const result = await unfollowUser(user.id, streamData.streamerId);
        if (isFailure(result)) throw result.error;
      }
    },
    onSuccess: (_, shouldFollow) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', user?.id, streamData?.streamerId] });
      queryClient.invalidateQueries({ queryKey: ['user-follows-homepage', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['seller-data', streamData?.streamerId] });
      toast.success(shouldFollow ? 'Successfully followed!' : 'Successfully unfollowed!');
    },
    onError: (error) => {
      console.error('Follow/unfollow error:', error);
      toast.error('Failed to update follow status');
    },
  });

  const toggleFollow = () => {
    if (!user) {
      toast.error('Please sign in to follow sellers');
      return;
    }
    followMutation.mutate(!isFollowing);
  };

  const toggleProductLike = (productId: string) => {
    setLikedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  // Handle loading state
  if (isLoadingStream) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading stream...</p>
          </div>
        </main>
      </div>
    );
  }

  // Handle error state
  if (streamError || !streamData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-destructive">
              {streamError instanceof Error ? streamError.message : 'Stream not found'}
            </p>
            <Link to="/">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <PaymentInfoDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} />

      <main className="flex h-[calc(100vh-80px)] flex-col lg:flex-row lg:overflow-hidden">
        {/* Left Sidebar - Shop/Auction Controls - Stacked on mobile */}
        <div className="order-2 w-full border-b bg-card lg:order-1 lg:w-[30%] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="space-y-4 p-3 lg:p-4">
            {/* Stream title */}
            <div>
              <h1 className="mb-2 text-lg font-bold">{streamData?.title}</h1>
            </div>

            <Separator />

            {/* Stream seller info */}
            <div>
              <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center space-x-3">
                  <Avatar className="flex-shrink-0">
                    <AvatarImage src={sellerData?.profile?.avatar_url || streamData?.streamerAvatar} />
                    <AvatarFallback>{streamData?.streamerName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link
                      to={`/seller/${streamData?.streamerId}`}
                      className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {sellerData?.profile?.full_name || streamData?.streamerName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{sellerData?.followerCount || 0} followers</p>
                  </div>
                </div>
                <Button
                  onClick={toggleFollow}
                  variant={isFollowing ? 'outline' : 'default'}
                  size="sm"
                  disabled={followMutation.isPending}
                  className="w-full flex-shrink-0 sm:w-auto"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {followMutation.isPending ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              </div>
            </div>

            {/* Loyalty Rewards Card */}
            <Card className="border border-purple-200/50 bg-gradient-to-br from-purple-50/80 to-blue-50/80 p-4 shadow-lg backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-sm"></div>
                    <h4 className="text-base font-semibold text-purple-800">Loyalty Rewards</h4>
                  </div>
                  <div className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-600">
                    Level 1
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-sm font-semibold text-white shadow-md hover:from-green-600 hover:to-emerald-600">
                      £1 ✓
                    </Badge>
                    <div className="h-2 w-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-inner"></div>
                    <Badge className="border-0 bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-sm font-semibold text-white shadow-md">
                      £2 🎯
                    </Badge>
                    <div className="h-2 w-12 rounded-full bg-gray-200 shadow-inner"></div>
                    <Badge
                      variant="outline"
                      className="border-gray-300 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-500"
                    >
                      £3
                    </Badge>
                  </div>

                  <div className="flex items-center justify-center gap-2 rounded-full bg-white/50 px-3 py-2 text-sm text-purple-700">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-purple-400 to-blue-400"></div>
                    <span className="font-medium">3 more purchases to unlock level 2</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stream Subscription Section */}
            <Card className="border border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-4 shadow-lg backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-blue-800">Subscribe to Stream</h4>
                    <p className="text-sm text-blue-600">Get exclusive access and special benefits</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-800">£4.99</div>
                    <div className="text-xs text-blue-600">per month</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold text-white shadow-md hover:from-blue-600 hover:to-indigo-600">
                    Subscribe Now
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-blue-300 px-4 text-blue-700 hover:bg-blue-50">
                        Perks
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                          Subscriber Perks
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="mb-4 text-sm text-muted-foreground">
                          <p>Unlock exclusive benefits when you subscribe to this stream:</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                            <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="font-medium text-blue-800">Priority Bidding</div>
                              <div className="text-xs text-blue-600">Get first chance on new auction items</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                            <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="font-medium text-blue-800">Exclusive Chat Badge</div>
                              <div className="text-xs text-blue-600">
                                Stand out in chat with a special subscriber badge
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                            <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="font-medium text-blue-800">Early Stream Access</div>
                              <div className="text-xs text-blue-600">Join streams 5 minutes before they go public</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                            <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="font-medium text-blue-800">Subscriber-Only Deals</div>
                              <div className="text-xs text-blue-600">Access to special discounts and offers</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>

            <Separator />

            {/* Seller Controls */}
            {isStreamer && <ListingManager streamId={streamData.id} />}

            {/* Convert to Seller */}
            {!isStreamer && profile?.user_type === 'buyer' && <SellerModeConverter />}

            {/* Product listings */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold lg:text-base">Shop</h3>
                <Link to={`/seller/${streamData.streamerId}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Show all
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {products.slice(0, 2).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-2 rounded-lg border p-2 lg:space-x-3 lg:p-3"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 rounded object-cover lg:h-16 lg:w-16"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-medium lg:text-sm">{product.name}</h4>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="text-xs font-bold lg:text-sm">{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">{product.originalPrice}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center">
                        <Button size="sm" className="h-6 px-2 text-xs lg:px-3">
                          <ShoppingBag className="mr-1 h-3 w-3" />
                          <span className="hidden sm:inline">Add to Cart</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No products available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Video Player - Prioritized on mobile */}
        <div className="order-1 flex w-full flex-1 flex-col bg-muted/30 lg:order-2">
          {/* Payment Info Notification */}
          {showPaymentNotification && (
            <div className="mx-3 mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg lg:mx-4 lg:mt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Add Payment Info</h4>
                    <p className="text-sm text-blue-700">
                      Complete your setup to participate in auctions and make purchases
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowPaymentDialog(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentNotification(false)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex min-h-[200px] items-center justify-center p-3 pt-8 lg:h-full lg:p-4 lg:pt-12">
            <div className="aspect-video w-full max-w-sm lg:max-w-xs">
              <StreamPlayer
                streamId={streamData.id}
                title={streamData.title}
                streamerName={streamData.streamerName}
                isLive={streamData.isLive}
                viewerCount={streamData.viewerCount}
                isHost={false}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Giveaways/Bidding and Chat - Stacked on mobile */}
        <div className="order-3 flex h-[calc(100vh-80px)] w-full flex-col border-t bg-card lg:order-3 lg:w-[30%] lg:border-l lg:border-t-0">
          <div className="flex h-full flex-1 flex-col">
            {/* Top section - Giveaways/Bidding */}
            <div className="border-b p-3 lg:p-4">
              {streamData.isLive && (
                <div>
                  <BiddingSection streamId={streamData.id} isStreamer={isStreamer} />
                </div>
              )}
            </div>

            {/* Bottom section - Chat */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <LiveChat streamId={streamData.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StreamPage;
