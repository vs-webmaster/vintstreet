import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Button } from '@/components/ui/button';
import { fetchShopSectionsWithProducts } from '@/services/shop';
import { isFailure } from '@/types/api';

interface ShopSection {
  id: string;
  title: string;
  image_url: string;
  category_id: string;
  custom_link: string | null;
  is_active: boolean;
  display_order: number;
}

interface Product {
  id: string;
  product_name: string;
  starting_price: number;
  discounted_price: number | null;
  thumbnail: string | null;
  slug?: string;
}

export const ShopSections = () => {
  const navigate = useNavigate();

  // Optimized: Single query with joins to fetch sections and products
  const { data: sectionsWithProducts = [] } = useQuery({
    queryKey: ['shop-sections-with-products'],
    queryFn: async () => {
      const result = await fetchShopSectionsWithProducts();
      if (isFailure(result)) throw result.error;

      const data = result.data;
      // Transform the nested data structure
      const sectionsMap = new Map<string, { section: ShopSection; products: Product[] }>();

      data?.forEach((section: any) => {
        if (!sectionsMap.has(section.id)) {
          sectionsMap.set(section.id, {
            section: {
              id: section.id,
              title: section.title,
              image_url: section.image_url,
              category_id: section.category_id,
              custom_link: section.custom_link,
              is_active: section.is_active,
              display_order: section.display_order,
            },
            products: [],
          });
        }

        const sectionData = sectionsMap.get(section.id)!;
        section.shop_section_products?.forEach((sp: any) => {
          if (sp.listings && sp.listings.status === 'published' && sectionData.products.length < 3) {
            sectionData.products.push({
              id: sp.listings.id,
              product_name: sp.listings.product_name,
              starting_price: sp.listings.starting_price,
              discounted_price: sp.listings.discounted_price,
              thumbnail: sp.listings.thumbnail,
              slug: sp.listings.slug,
            });
          }
        });
      });

      return Array.from(sectionsMap.values()).filter((sd) => sd.products.length > 0);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - sections are admin-controlled and change infrequently
  });

  if (sectionsWithProducts.length === 0) return null;

  return (
    <div className="space-y-12 py-12">
      {sectionsWithProducts.map(({ section, products }) => {
        const sectionLink = section.custom_link || `/shop?category=${section.category_id}`;

        return (
          <div key={section.id} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">{section.title}</h2>
              <Button variant="ghost" onClick={() => navigate(sectionLink)} className="gap-2">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              {/* Left image */}
              <div
                className="group cursor-pointer overflow-hidden rounded-lg lg:col-span-1"
                onClick={() => navigate(sectionLink)}
              >
                <div className="relative h-full min-h-[400px]">
                  <img
                    src={section.image_url}
                    alt={section.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
                </div>
              </div>

              {/* Right 3 products */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:col-span-3">
                {products.map((product) => {
                  const finalPrice = product.discounted_price || product.starting_price;
                  const hasDiscount = product.discounted_price && product.discounted_price < product.starting_price;

                  return (
                    <div
                      key={product.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/product/${product.slug || product.id}`)}
                    >
                      <div className="relative mb-3 overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: '3/4' }}>
                        {product.thumbnail ? (
                          <CachedImage
                            src={product.thumbnail}
                            alt={product.product_name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            priority={false}
                            width={280}
                            height={373}
                            sizes="(min-width: 1024px) 33vw, 50vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                          </div>
                        )}
                      </div>
                      <h3 className="mb-2 line-clamp-2 text-sm font-semibold">{product.product_name}</h3>
                      <div>
                        {hasDiscount ? (
                          <div className="flex items-center gap-2">
                            <PriceDisplay gbpPrice={finalPrice} className="font-bold" />
                            <PriceDisplay
                              gbpPrice={product.starting_price}
                              className="text-sm text-muted-foreground line-through"
                            />
                          </div>
                        ) : (
                          <PriceDisplay gbpPrice={finalPrice} className="font-bold" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
