import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ContactSellerModal } from '@/components/ContactSellerModal';
import { ProductEditModal } from '@/components/dashboard/ProductEditModal';
import { AuctionDisplay } from '@/components/product/AuctionDisplay';
import { ProductAttributes } from '@/components/product/ProductAttributes';
import { ProductGuideButtons } from '@/components/product/ProductGuideButtons';
import { ProductHeader } from '@/components/product/ProductHeader';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductPriceSection } from '@/components/product/ProductPriceSection';
import { ProductTabs } from '@/components/product/ProductTabs';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useProductData, type Product } from '@/hooks/useProductData';
import {
  fetchCategorySlug,
  fetchSubcategorySlug,
  fetchSubSubcategorySlug,
  fetchSubSubSubcategorySlug,
} from '@/services/categories';
import { isFailure } from '@/types/api';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const { addToCart, cartItems } = useCart();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Get the previous location from navigation state
  const fromLocation = (location.state as { from?: string })?.from || '/shop';

  const { product, isLoading, productAttributes, relatedProducts } = useProductData(id);

  // Check if product is an auction (use product data we already have)
  const isAuction = product?.auction_type !== null && product?.auction_type !== undefined;

  // Track recently viewed products
  useEffect(() => {
    if (product?.id) {
      try {
        const stored = localStorage.getItem('recentlyViewed');
        let recentlyViewed: string[] = stored ? JSON.parse(stored) : [];

        // Remove if already exists
        recentlyViewed = recentlyViewed.filter((pid) => pid !== product.id);

        // Add to beginning
        recentlyViewed.unshift(product.id);

        // Keep only last 10
        recentlyViewed = recentlyViewed.slice(0, 10);

        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
      } catch (error) {
        console.error('Error saving to recently viewed:', error);
      }
    }
  }, [product?.id]);

  // Fetch category slugs for breadcrumb navigation
  const { data: categoryHierarchy } = useQuery({
    queryKey: [
      'category-slugs',
      product?.product_categories?.id,
      product?.product_subcategories?.id,
      product?.product_sub_subcategories?.id,
      product?.product_sub_sub_subcategories?.id,
    ],
    queryFn: async () => {
      if (!product) return null;

      const hierarchy: {
        category?: { name: string; slug: string };
        subcategory?: { name: string; slug: string };
        subSubcategory?: { name: string; slug: string };
        subSubSubcategory?: { name: string; slug: string };
      } = {};

      // Fetch category slug
      if (product.product_categories) {
        const result = await fetchCategorySlug(product.product_categories.id);
        if (!isFailure(result) && result.data) {
          hierarchy.category = {
            name: product.product_categories.name,
            slug: result.data,
          };
        }
      }

      // Fetch subcategory slug
      if (product.product_subcategories) {
        const result = await fetchSubcategorySlug(product.product_subcategories.id);
        if (!isFailure(result) && result.data) {
          hierarchy.subcategory = {
            name: product.product_subcategories.name,
            slug: result.data,
          };
        }
      }

      // Fetch sub-subcategory slug
      if (product.product_sub_subcategories) {
        const result = await fetchSubSubcategorySlug(product.product_sub_subcategories.id);
        if (!isFailure(result) && result.data) {
          hierarchy.subSubcategory = {
            name: product.product_sub_subcategories.name,
            slug: result.data,
          };
        }
      }

      // Fetch sub-sub-subcategory slug
      if (product.product_sub_sub_subcategories) {
        const result = await fetchSubSubSubcategorySlug(product.product_sub_sub_subcategories.id);
        if (!isFailure(result) && result.data) {
          hierarchy.subSubSubcategory = {
            name: product.product_sub_sub_subcategories.name,
            slug: result.data,
          };
        }
      }

      return hierarchy;
    },
    enabled: !!product,
  });

  // Update URL to use slug if product has one and current URL uses ID
  useEffect(() => {
    if (product && product.slug && id !== product.slug) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
      if (isUUID) {
        navigate(`/product/${product.slug}`, { replace: true });
      }
    }
  }, [product, id, navigate]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(product.id);
      toast.success(`${product.product_name} has been added to your cart.`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart.');
    }
  };

  const handleProductUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['product', id] });
    queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
    queryClient.invalidateQueries({ queryKey: ['related-products'] });
    setShowEditModal(false);
    toast.success('Product updated successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Product Not Found</h1>
            <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(fromLocation)} size="sm" className="hidden md:flex">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>

          {isSuperAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/products')}
                size="sm"
                className="hidden md:flex"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Back to Admin
              </Button>
              <Button variant="outline" onClick={() => setShowEditModal(true)} size="sm" className="hidden md:flex">
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            </>
          )}

          {categoryHierarchy && (
            <Breadcrumb className="max-w-full overflow-hidden">
              <BreadcrumbList className="text-xs md:text-sm">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/shop">Shop</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {categoryHierarchy.category && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={`/shop/${categoryHierarchy.category.slug}`}>{categoryHierarchy.category.name}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}

                {categoryHierarchy.subcategory && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={`/shop/${categoryHierarchy.category?.slug}/${categoryHierarchy.subcategory.slug}`}>
                          {categoryHierarchy.subcategory.name}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}

                {categoryHierarchy.subSubcategory && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link
                          to={`/shop/${categoryHierarchy.category?.slug}/${categoryHierarchy.subcategory?.slug}/${categoryHierarchy.subSubcategory.slug}`}
                        >
                          {categoryHierarchy.subSubcategory.name}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}

                {categoryHierarchy.subSubSubcategory && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{categoryHierarchy.subSubSubcategory.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <ProductImageGallery
            productName={product.product_name}
            productImages={product.product_images}
            productImageAlts={product.product_image_alts}
          />

          <div className="space-y-6">
            <ProductHeader product={product as Product} />
            <ProductAttributes product={product as Product} />

            <ProductGuideButtons
              categoryId={product.product_categories?.id}
              subcategoryId={product.product_subcategories?.id}
              subSubcategoryId={product.product_sub_subcategories?.id}
              subSubSubcategoryId={product.product_sub_sub_subcategories?.id}
            />

            {product.excerpt && (
              <div className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.excerpt}</div>
            )}

            {isAuction ? (
              <AuctionDisplay productId={product.id} />
            ) : (
              <ProductPriceSection product={product as Product} cartItems={cartItems} onAddToCart={handleAddToCart} />
            )}

            <ProductTabs
              product={product as Product}
              productAttributes={productAttributes}
              onContactSeller={() => setShowContactModal(true)}
            />
          </div>
        </div>

        <RelatedProducts products={relatedProducts} />

        <ContactSellerModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          sellerId={product.seller_id}
          sellerName={product.seller_profiles?.shop_name || 'Seller'}
          productName={product.product_name}
        />

        {isSuperAdmin && (
          <ProductEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            product={product as unknown}
            onSave={handleProductUpdated}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;
