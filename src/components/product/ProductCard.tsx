// Reusable ProductCard Component
// Used in shop page, search results, recommendations, etc.

import { memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Plus, Timer } from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { useBuyerProtectionFees, calculateBuyerProtectionFee } from '@/hooks/useBuyerProtectionFees';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useCurrency } from '@/hooks/useCurrency';
import { useWishlistToggle } from '@/hooks/useWishlistToggle';

// Minimal product interface for ProductCard compatibility
// This allows the component to work with various product shapes across the app
export interface ProductCardProduct {
  id: string;
  slug?: string;
  product_name: string;
  starting_price: number;
  discounted_price?: number | null;
  thumbnail?: string | null;
  auction_type?: string | null;
  brands?: { id: string; name: string } | null;
  auctions?: Array<{
    id: string;
    current_bid: number | null;
    starting_bid: number | null;
    end_time: string;
    status: string;
    bid_count: number | null;
  }>;
}

export interface ProductCardProps {
  product: ProductCardProduct;
  index?: number;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  className?: string;
}

// Helper functions
const isAuctionProduct = (product: ProductCardProduct): boolean => {
  return product.auction_type === 'timed' && 
         Array.isArray(product.auctions) && 
         product.auctions.length > 0;
};

const getActiveAuction = (product: ProductCardProduct) => {
  if (!isAuctionProduct(product)) return null;
  return product.auctions?.[0] || null;
};

const getCurrentPrice = (product: ProductCardProduct): number => {
  if (isAuctionProduct(product)) {
    const auction = getActiveAuction(product);
    return auction?.current_bid || auction?.starting_bid || product.starting_price;
  }
  return product.discounted_price || product.starting_price;
};

const hasProductDiscount = (product: ProductCardProduct): boolean => {
  return !isAuctionProduct(product) && 
         product.discounted_price !== null && 
         product.discounted_price !== undefined &&
         product.discounted_price < product.starting_price;
};

export const ProductCard = memo(({ 
  product, 
  index = 0,
  showAddToCart = true,
  showWishlist = true,
  className = '',
}: ProductCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { addToCart, isInCart } = useCart();
  const { data: buyerProtectionFees } = useBuyerProtectionFees();
  const { convertPrice, formatPrice } = useCurrency();
  const { isProductInWishlist, handleWishlistToggle } = useWishlistToggle({
    productId: product.id,
    productName: product.product_name,
  });

  const isProductInCart = isInCart(product.id);
  const isAuction = isAuctionProduct(product);
  const auctionData = getActiveAuction(product);
  const currentBid = getCurrentPrice(product);
  const timeRemaining = useCountdownTimer(auctionData?.end_time);

  // Calculate buyer protection fee
  const buyerProtectionFee = calculateBuyerProtectionFee(
    product.discounted_price || product.starting_price,
    buyerProtectionFees
  );

  const handleCardClick = useCallback(() => {
    const productUrl = product.slug || product.id;
    navigate(`/product/${productUrl}`, { state: { from: location.pathname + location.search } });
  }, [product.slug, product.id, navigate, location.pathname, location.search]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isProductInCart) {
      toast({
        title: 'Already in cart',
        description: `${product.product_name} is already in your cart.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await addToCart(product.id);
      toast({
        title: 'Added to cart',
        description: `${product.product_name} has been added to your cart.`,
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
  }, [isProductInCart, product.id, product.product_name, addToCart, toast]);

  const productHasDiscount = hasProductDiscount(product);
  const finalPrice = product.discounted_price || product.starting_price;

  // Auction product card
  if (isAuction) {
    return (
      <Card 
        className={`group h-full cursor-pointer overflow-hidden transition-all hover:shadow-lg ${className}`} 
        onClick={handleCardClick}
      >
        <CardHeader className="relative p-0">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {product.thumbnail ? (
              <CachedImage
                src={product.thumbnail}
                alt={product.product_name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            {showWishlist && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={handleWishlistToggle}
              >
                <Heart className={`h-4 w-4 ${isProductInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            )}
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
            <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{product.product_name}</h3>
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
            {product.brands && <p className="truncate text-xs text-muted-foreground">{product.brands.name}</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Regular product card
  return (
    <Card
      className={`group h-full cursor-pointer border-0 bg-transparent shadow-none transition-shadow ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-[10px] bg-muted" style={{ aspectRatio: '3/4' }}>
          {product.thumbnail ? (
            <CachedImage
              src={product.thumbnail}
              alt={`${product.product_name}-vintstreet`}
              className="h-full w-full rounded-[10px] object-cover"
              priority={index < 10}
              width={280}
              height={373}
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {showWishlist && (
            <Button
              size="icon"
              variant="ghost"
              className={`absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background ${
                isProductInWishlist ? 'text-red-500' : 'text-muted-foreground'
              }`}
              onClick={handleWishlistToggle}
            >
              <Heart className={`h-4 w-4 ${isProductInWishlist ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-bold">{product.product_name}</h3>
        {product.brands && <p className="mb-2 text-xs text-muted-foreground">{product.brands.name}</p>}

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {productHasDiscount ? (
              <>
                <PriceDisplay gbpPrice={finalPrice} className="text-2xl font-bold text-primary" />
                <PriceDisplay
                  gbpPrice={product.starting_price}
                  className="text-sm text-muted-foreground line-through"
                />
              </>
            ) : (
              <PriceDisplay gbpPrice={finalPrice} className="text-2xl font-bold text-primary" />
            )}
            {buyerProtectionFee !== null && (
              <p className="text-xs text-blue-600">
                (Buyer Protection: {formatPrice(convertPrice(buyerProtectionFee))})
              </p>
            )}
          </div>
          {showAddToCart && !isAuction && (
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleAddToCart}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';
