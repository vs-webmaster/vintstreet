import { useEffect, useMemo, Suspense, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Timer, Heart, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CachedImage } from '@/components/CachedImage';
import { MegaMenuNav } from '@/components/MegaMenuNav';
import { PriceDisplay } from '@/components/PriceDisplay';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useToast } from '@/hooks/useToast';
import { useWishlist } from '@/hooks/useWishlist';
import { getSellerDisplayName, extractSellerIds, fetchSellerInfoMap } from '@/lib/sellerNameUtils';
import { fetchAuctionProducts } from '@/services/listings';
import { isFailure } from '@/types/api';

const PRODUCTS_PER_PAGE = 32;

interface AuctionProduct {
  id: string;
  slug?: string;
  product_name: string;
  starting_price: number;
  thumbnail?: string | null;
  product_description?: string | null;
  seller_id: string;
  status: string;
  created_at: string;
  auction_type: string;
  seller_info_view: {
    shop_name: string;
    display_name_format?: string;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  auctions: {
    id: string;
    current_bid: number | null;
    starting_bid: number | null;
    end_time: string;
    status: string;
    bid_count: number | null;
    reserve_price: number;
    reserve_met: boolean | null;
  }[];
}

const AuctionCard = memo(({ auction }: { auction: AuctionProduct }) => {
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { user } = useAuth();

  const isProductInWishlist = isInWishlist(auction.id);

  const auctionData = auction.auctions?.[0];
  const currentBid = auctionData?.current_bid || auctionData?.starting_bid || auction.starting_price;
  const timeRemaining = useCountdownTimer(auctionData?.end_time);

  const sellerDisplayName = auction.seller_info_view
    ? getSellerDisplayName({
        shop_name: auction.seller_info_view.shop_name,
        display_name_format: auction.seller_info_view.display_name_format,
        profile: {
          full_name: auction.seller_info_view.full_name,
          username: auction.seller_info_view.username,
        },
      })
    : 'Unknown Seller';

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your wishlist',
        variant: 'destructive',
      });
      return;
    }

    if (isProductInWishlist) {
      await removeFromWishlist(auction.id);
      toast({
        title: 'Removed from wishlist',
        description: `${auction.product_name} has been removed from your wishlist`,
      });
    } else {
      await addToWishlist(auction.id);
      toast({
        title: 'Added to wishlist',
        description: `${auction.product_name} has been added to your wishlist`,
      });
    }
  };

  const handleClick = () => {
    if (auction.slug) {
      navigate(`/product/${auction.slug}`);
    } else {
      navigate(`/product/${auction.id}`);
    }
  };

  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg" onClick={handleClick}>
      <CardHeader className="relative p-0">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {auction.thumbnail ? (
            <CachedImage
              src={auction.thumbnail}
              alt={auction.product_name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleWishlistToggle}
          >
            <Heart className={`h-4 w-4 ${isProductInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          {auctionData && (
            <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">
              <Timer className="mr-1 h-3 w-3" />
              {timeRemaining}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{auction.product_name}</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current Bid</p>
              <div className="text-lg font-bold text-foreground">
                <PriceDisplay gbpPrice={currentBid} />
              </div>
            </div>
            {auctionData && auctionData.bid_count !== null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Bids</p>
                <p className="text-sm font-semibold">{auctionData.bid_count}</p>
              </div>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{sellerDisplayName}</p>
        </div>
      </CardContent>
    </Card>
  );
});

AuctionCard.displayName = 'AuctionCard';

const AuctionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sortBy = searchParams.get('sort') || 'ending_soon';

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['auction-products', sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await fetchAuctionProducts({
        page: pageParam,
        pageSize: PRODUCTS_PER_PAGE,
        sortBy,
      });

      if (isFailure(result)) throw result.error;

      // Fetch seller information separately
      const sellersMap = await fetchSellerInfoMap(extractSellerIds(result.data.products || []));

      return {
        products: (result.data.products || []).map((product) => ({
          ...product,
          seller_info_view: sellersMap.get(product.seller_id) || null,
        })),
        nextPage: pageParam + 1,
        totalCount: result.data.totalCount,
      };
    },
    getNextPageParam: (lastPage, pages) => {
      const loadedCount = pages.reduce((sum, page) => sum + page.products.length, 0);
      return loadedCount < lastPage.totalCount ? lastPage.nextPage : undefined;
    },
    initialPageParam: 0,
  });

  const allProducts = useMemo(() => data?.pages.flatMap((page) => page.products) || [], [data]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    navigate(`/auctions?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <Suspense fallback={<div className="h-16" />}>
        <MegaMenuNav />
      </Suspense>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Live Auctions</h1>
              <p className="text-muted-foreground">Bid on exclusive items ending soon</p>
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="rounded-md border bg-background px-4 py-2 text-foreground"
              >
                <option value="ending_soon">Ending Soon</option>
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="text-destructive">Failed to load auctions. Please try again.</p>
          </div>
        ) : allProducts.length === 0 ? (
          <div className="py-12 text-center">
            <Timer className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-semibold">No Active Auctions</h2>
            <p className="text-muted-foreground">Check back soon for new auctions!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {allProducts.map((product) => (
                <AuctionCard key={product.id} auction={product} />
              ))}
            </div>

            {isFetchingNextPage && (
              <div className="mt-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </>
        )}
      </main>

      <ScrollToTopButton />

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default AuctionsPage;
