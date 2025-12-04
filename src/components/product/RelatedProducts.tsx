import { useNavigate } from 'react-router-dom';
import { Plus, Heart } from 'lucide-react';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/hooks/useProductData';
import { useToast } from '@/hooks/useToast';
import { useWishlistToggle } from '@/hooks/useWishlistToggle';
import { getSellerDisplayName } from '@/lib/sellerNameUtils';

interface RelatedProductsProps {
  products: Product[];
}

export const RelatedProducts = ({ products }: RelatedProductsProps) => {
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();

  if (products.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">Related Products</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <RelatedProductCard
            key={product.id}
            product={product}
            cartItems={cartItems}
            addToCart={addToCart}
            toast={toast}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
};

interface RelatedProductCardProps {
  product: Product;
  cartItems: any[];
  addToCart: (listingId: string) => Promise<void>;
  toast: any;
  navigate: any;
}

const RelatedProductCard = ({ product, cartItems, addToCart, toast, navigate }: RelatedProductCardProps) => {
  const sellerDisplayName = getSellerDisplayName(product.seller_profiles);
  const { isProductInWishlist, handleWishlistToggle } = useWishlistToggle({
    productId: product.id,
    productName: product.product_name,
  });

  const handleCardClick = () => {
    const productUrl = product.slug || product.id;
    navigate(`/product/${productUrl}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const existingItem = cartItems.find((item) => item.id === product.id);
    if (existingItem) {
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

  const hasDiscount = product.discounted_price && product.discounted_price < product.starting_price;
  const finalPrice = product.discounted_price || product.starting_price;

  return (
    <Card className="group cursor-pointer transition-shadow hover:shadow-lg" onClick={handleCardClick}>
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-muted">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={`${product.product_name}-vintstreet`}
              className="h-full w-full rounded-[10px] object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {/* Wishlist heart button */}
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
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold">{product.product_name}</h3>

        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="max-w-[150px] truncate text-xs text-muted-foreground">By {sellerDisplayName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {hasDiscount ? (
              <>
                <PriceDisplay gbpPrice={finalPrice} className="text-lg font-bold text-primary" />
                <PriceDisplay
                  gbpPrice={product.starting_price}
                  className="text-xs text-muted-foreground line-through"
                />
              </>
            ) : (
              <PriceDisplay gbpPrice={finalPrice} className="text-lg font-bold text-primary" />
            )}
          </div>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleAddToCart}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
