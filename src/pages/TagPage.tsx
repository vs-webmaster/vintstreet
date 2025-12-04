import { lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CachedImage } from '@/components/CachedImage';
import { MegaMenuNav } from '@/components/MegaMenuNav';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { getSellerDisplayName, extractSellerIds, fetchSellerInfoMap } from '@/lib/sellerNameUtils';
import { fetchProductsByIds } from '@/services/products';
import { fetchTagBySlug, fetchProductIdsByTagId } from '@/services/tags';
import { fetchNonSuspendedSellerIds } from '@/services/users';
import { isFailure } from '@/types/api';

interface Product {
  id: string;
  slug?: string;
  product_name: string;
  starting_price: number;
  discounted_price: number | null;
  thumbnail: string | null;
  seller_id: string;
  status: 'draft' | 'published' | 'private' | 'out_of_stock';
  seller_info_view: {
    shop_name: string;
    display_name_format?: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

const ProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isProductInWishlist = isInWishlist(product.id);

  const sellerProfiles = product.seller_info_view
    ? {
        shop_name: product.seller_info_view.shop_name,
        display_name_format: product.seller_info_view.display_name_format,
        profiles: {
          full_name: product.seller_info_view.full_name,
        },
      }
    : null;
  const sellerDisplayName = getSellerDisplayName(sellerProfiles);

  const handleCardClick = () => {
    const productUrl = product.slug || product.id;
    navigate(`/product/${productUrl}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const existingItem = cartItems.find((item) => item.id === product.id);
    if (existingItem) {
      toast.error(`${product.product_name} is already in your cart.`);
      return;
    }

    try {
      await addToCart(product.id);
      toast.success(`${product.product_name} has been added to your cart.`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart.');
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.id) {
      toast.error('Please log in to add items to your wishlist');
      return;
    }

    try {
      if (isProductInWishlist) {
        await removeFromWishlist(product.id);
        toast.success(`${product.product_name} has been removed from your wishlist.`);
      } else {
        await addToWishlist(product.id);
        toast.success(`${product.product_name} has been added to your wishlist.`);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist. Please try again.');
    }
  };

  const hasDiscount = product.discounted_price && product.discounted_price < product.starting_price;
  const finalPrice = product.discounted_price || product.starting_price;

  return (
    <Card className="group h-full cursor-pointer transition-shadow hover:shadow-lg" onClick={handleCardClick}>
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg bg-muted" style={{ aspectRatio: '3/4' }}>
          {product.thumbnail ? (
            <CachedImage
              src={product.thumbnail}
              alt={`${product.product_name}-vintstreet`}
              className="h-full w-full object-cover"
              width={280}
              height={373}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
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
        <h3 className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm font-semibold">{product.product_name}</h3>

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

const ProductSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-[3/4] w-full" />
    <CardContent className="space-y-2 p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-6 w-1/2" />
    </CardContent>
  </Card>
);

export default function TagPage() {
  const { tagSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch tag details
  const { data: tag, isLoading: tagLoading } = useQuery({
    queryKey: ['tag-by-slug', tagSlug],
    queryFn: async () => {
      if (!tagSlug) return null;
      const result = await fetchTagBySlug(tagSlug);
      if (isFailure(result)) throw result.error;
      // Only return if tag is active
      if (result.data && !result.data.is_active) return null;
      return result.data;
    },
    enabled: !!tagSlug,
  });

  // Fetch wishlist
  const { getWishlistListingIds } = useWishlist();
  const userWishlist = getWishlistListingIds();

  // Fetch products for this tag
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['tag-products', tag?.id],
    queryFn: async () => {
      if (!tag?.id) return [];

      // Get non-suspended sellers
      const sellersResult = await fetchNonSuspendedSellerIds();
      const nonSuspendedSellerIds = isFailure(sellersResult) ? [] : sellersResult.data;

      // Get product IDs with this tag
      const productIdsResult = await fetchProductIdsByTagId(tag.id);
      if (isFailure(productIdsResult)) throw productIdsResult.error;
      if (productIdsResult.data.length === 0) return [];

      // Get products
      const productsResult = await fetchProductsByIds(productIdsResult.data, {
        status: ['published'],
      });

      if (isFailure(productsResult)) throw productsResult.error;

      // Filter by non-suspended sellers
      const filteredProducts = productsResult.data.filter((product) =>
        nonSuspendedSellerIds.includes(product.seller_id),
      );

      // Fetch seller info
      const sellersMap = await fetchSellerInfoMap(extractSellerIds(filteredProducts));

      return filteredProducts.map((product) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];
    },
    enabled: !!tag?.id,
  });

  if (tagLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <Suspense fallback={null}>
          <MegaMenuNav />
        </Suspense>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <Suspense fallback={null}>
          <MegaMenuNav />
        </Suspense>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Tag not found</h1>
            <Button onClick={() => navigate('/shop')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Suspense fallback={null}>
        <MegaMenuNav />
      </Suspense>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" className="mb-4" onClick={() => navigate('/shop')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color || '#000' }} />
              <h1 className="text-3xl font-bold">{tag.name}</h1>
            </div>
            {tag.description && <p className="mt-2 text-muted-foreground">{tag.description}</p>}
            <p className="mt-2 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">No products found for this tag</p>
              <Button onClick={() => navigate('/shop')}>Browse All Products</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
