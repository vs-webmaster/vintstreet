import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Gavel } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PriceDisplay } from '@/components/PriceDisplay';
import { ShareWishlistButton } from '@/components/ShareWishlistButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { useWishlist } from '@/hooks/useWishlist';

interface WishlistItem {
  id: string;
  listing_id: string;
  listings: {
    id: string;
    slug?: string;
    product_name: string;
    starting_price: number;
    discounted_price: number | null;
    thumbnail: string | null;
    status: 'draft' | 'published' | 'private';
    auction_type?: string | null;
    seller_profiles: {
      shop_name: string;
    } | null;
    auctions?:
      | {
          id: string;
          status: string;
          end_time: string;
          current_bid: number | null;
        }[]
      | null;
  };
}

const WishlistPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleAddToCart = async (item: WishlistItem) => {
    const existingItem = cartItems.find((cartItem) => cartItem.listings?.id === item.listings.id);
    if (existingItem) {
      toast({
        title: 'Already in cart',
        description: `${item.listings.product_name} is already in your cart.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await addToCart(item.listings.id);
      toast({
        title: 'Added to cart',
        description: `${item.listings.product_name} has been added to your cart.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Error adding to cart',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromWishlist = async (id: string) => {
    try {
      await removeFromWishlist(id);
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist.',
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error removing from wishlist',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleProductClick = (productId: string, productSlug?: string) => {
    const productUrl = productSlug || productId;
    navigate(`/product/${productUrl}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">My Wishlist</h1>
            </div>
            <ShareWishlistButton />
          </div>

          {wishlistItems.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">Your wishlist is empty</h2>
              <p className="mb-6 text-muted-foreground">Start adding items you love to your wishlist!</p>
              <Button onClick={() => navigate('/shop')}>Browse Products</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {wishlistItems.map((item) => {
                const hasDiscount =
                  item.listings.discounted_price && item.listings.discounted_price < item.listings.starting_price;
                const finalPrice = item.listings.discounted_price || item.listings.starting_price;

                const isAuction = item.listings.auction_type && item.listings.auction_type !== 'marketplace';
                const auction = item.listings.auctions?.[0];
                const isAuctionActive = auction?.status === 'active' && new Date(auction.end_time) > new Date();

                return (
                  <Card
                    key={item.id}
                    className="group cursor-pointer transition-shadow hover:shadow-lg"
                    onClick={() => handleProductClick(item.listings.id, item.listings.slug)}
                  >
                    <CardHeader className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg bg-muted">
                        {item.listings.thumbnail ? (
                          <img
                            src={item.listings.thumbnail}
                            alt={`${item.listings.product_name}-vintstreet`}
                            className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-48 w-full items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                          </div>
                        )}
                        {isAuction && (
                          <div className="absolute right-2 top-2 rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                            Auction
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h3 className="mb-2 line-clamp-2 text-sm font-semibold">{item.listings.product_name}</h3>

                      <p className="mb-3 text-xs text-muted-foreground">
                        by {item.listings.seller_profiles?.shop_name || 'Seller'}
                      </p>

                      <div className="mb-4 flex flex-col gap-1">
                        {isAuction && auction ? (
                          <>
                            <PriceDisplay
                              gbpPrice={auction.current_bid || item.listings.starting_price}
                              className="text-lg font-bold text-primary"
                            />
                            <span className="text-xs text-muted-foreground">
                              {auction.current_bid ? 'Current Bid' : 'Starting Bid'}
                            </span>
                          </>
                        ) : hasDiscount ? (
                          <>
                            <PriceDisplay gbpPrice={finalPrice} className="text-lg font-bold text-primary" />
                            <PriceDisplay
                              gbpPrice={item.listings.starting_price}
                              className="text-xs text-muted-foreground line-through"
                            />
                          </>
                        ) : (
                          <PriceDisplay gbpPrice={finalPrice} className="text-lg font-bold text-primary" />
                        )}
                      </div>

                      <div className="flex gap-2">
                        {isAuction ? (
                          isAuctionActive ? (
                            <Button
                              className="flex-1"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(item.listings.id, item.listings.slug);
                              }}
                            >
                              <Gavel className="mr-2 h-4 w-4" />
                              Bid on Item
                            </Button>
                          ) : (
                            <Button className="flex-1" size="sm" variant="outline" disabled>
                              Auction Ended
                            </Button>
                          )
                        ) : (
                          <Button
                            className="flex-1"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item as unknown as WishlistItem);
                            }}
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Add to Cart
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromWishlist(item.listing_id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
