import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { buildCategoryHierarchy, buildCategoryLevelMaps } from '@/lib/categoryHierarchyUtils';
import { filterByCategoryId } from '@/lib/filterUtils';
import {
  fetchCategories,
  fetchAllSubcategories,
  fetchAllSubSubcategories,
  fetchAllSubSubSubcategories,
} from '@/services/categories';
import {
  fetchMegaMenuCategoryBrands,
  fetchMegaMenuTrendingItems,
  fetchMegaMenuBestSellers,
  fetchMegaMenuLuxuryBrands,
} from '@/services/megaMenu';
import { isFailure } from '@/types/api';

interface Brand {
  id: string;
  name: string;
}

interface CategoryBrand {
  brand_id: string;
  brands: Brand;
}

interface TrendingItem {
  id: string;
  name?: string;
  path?: string;
}

interface BestSeller {
  id: string;
  name?: string;
  path?: string;
}

interface LuxuryBrand {
  brand_id: string;
  brands: Brand;
}

interface ProductSubSubSubcategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductSubSubcategory {
  id: string;
  name: string;
  slug: string;
  product_sub_sub_subcategories: ProductSubSubSubcategory[];
}

interface ProductSubcategory {
  id: string;
  name: string;
  slug: string;
  product_sub_subcategories: ProductSubSubcategory[];
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  product_subcategories: ProductSubcategory[];
  brands?: CategoryBrand[];
  trending?: TrendingItem[];
  bestSellers?: BestSeller[];
  luxuryBrands?: LuxuryBrand[];
}

const MobileCategoryNav = () => {
  const [open, setOpen] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['mobile-mega-menu-categories'],
    queryFn: async () => {
      const [
        catsResult,
        subsResult,
        subSubsResult,
        subSubSubsResult,
        categoryBrandsResult,
        trendingResult,
        bestSellersResult,
        luxuryBrandsResult,
      ] = await Promise.all([
        fetchCategories(),
        fetchAllSubcategories(),
        fetchAllSubSubcategories(),
        fetchAllSubSubSubcategories(),
        fetchMegaMenuCategoryBrands(),
        fetchMegaMenuTrendingItems(),
        fetchMegaMenuBestSellers(),
        fetchMegaMenuLuxuryBrands(),
      ]);

      if (isFailure(catsResult)) throw catsResult.error;
      if (isFailure(subsResult)) throw subsResult.error;
      if (isFailure(subSubsResult)) throw subSubsResult.error;
      if (isFailure(subSubSubsResult)) throw subSubSubsResult.error;
      if (isFailure(categoryBrandsResult)) throw categoryBrandsResult.error;
      if (isFailure(trendingResult)) throw trendingResult.error;
      if (isFailure(bestSellersResult)) throw bestSellersResult.error;
      if (isFailure(luxuryBrandsResult)) throw luxuryBrandsResult.error;

      const cats = { data: catsResult.data || [] };
      const subs = { data: subsResult.data || [] };
      const subSubs = { data: subSubsResult.data || [] };
      const subSubSubs = { data: subSubSubsResult.data || [] };
      const categoryBrands = { data: categoryBrandsResult.data || [] };
      const trending = { data: trendingResult.data || [] };
      const bestSellers = { data: bestSellersResult.data || [] };
      const luxuryBrands = { data: luxuryBrandsResult.data || [] };

      // Build maps for quick lookup
      const { l2Map, l3Map, l4Map } = buildCategoryLevelMaps(null, subs.data, subSubs.data, subSubSubs.data);

      // Build hierarchy client-side
      const categoriesWithData = (cats.data || []).map((cat) => ({
        ...cat,
        brands: filterByCategoryId(categoryBrands.data, cat.id).map((cb) => ({
          brand_id: cb.brand_id,
          brands: cb.brands as Brand,
        })),
        trending: filterByCategoryId(trending.data, cat.id).map((t: any) => {
          const l4 = l4Map.get(t.sub_sub_subcategory_id);
          const l3 = l4 ? l3Map.get(l4.sub_subcategory_id) : undefined;
          const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
          return {
            id: t.sub_sub_subcategory_id,
            name: l4?.name,
            path: l2 && l3 && l4 ? `/shop/${cat.slug}/${l2.slug}/${l3.slug}/${l4.slug}` : undefined,
          };
        }),
        bestSellers: filterByCategoryId(bestSellers.data, cat.id).map((bs: any) => {
          const l4 = l4Map.get(bs.sub_sub_subcategory_id);
          const l3 = l4 ? l3Map.get(l4.sub_subcategory_id) : undefined;
          const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
          return {
            id: bs.sub_sub_subcategory_id,
            name: l4?.name,
            path: l2 && l3 && l4 ? `/shop/${cat.slug}/${l2.slug}/${l3.slug}/${l4.slug}` : undefined,
          };
        }),
        luxuryBrands: filterByCategoryId(luxuryBrands.data, cat.id).map((lb) => ({
          brand_id: lb.brand_id,
          brands: lb.brands as Brand,
        })),
        product_subcategories: buildCategoryHierarchy(
          cat.id,
          subs.data || [],
          subSubs.data || [],
          subSubSubs.data || [],
        ),
      }));

      return categoriesWithData as ProductCategory[];
    },
  });

  const handleLinkClick = () => {
    setOpen(false);
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="text-primary-foreground">
        <Menu className="mr-2 h-4 w-4" />
        Categories
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-background/10">
          <Menu className="mr-2 h-4 w-4" />
          Categories
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full p-0 sm:w-80">
        <SheetHeader className="border-b p-4">
          <SheetTitle>Shop by Category</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {categories?.map((category) => (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    {category.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-2">
                      {/* Popular Brands */}
                      {category.brands && category.brands.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="brands">
                            <AccordionTrigger className="py-2 text-sm font-medium">Popular Brands</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-1 pl-2">
                                {category.brands.map((brandItem) => (
                                  <Link
                                    key={brandItem.brand_id}
                                    to={`/shop/${category.slug}?brand=${brandItem.brands.name}`}
                                    onClick={handleLinkClick}
                                    className="block py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                  >
                                    {brandItem.brands.name}
                                  </Link>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {/* Subcategories */}
                      {category.product_subcategories?.map((subcategory) => (
                        <Accordion key={subcategory.id} type="single" collapsible>
                          <AccordionItem value={subcategory.id}>
                            <AccordionTrigger className="py-2 text-sm font-medium">
                              <Link
                                to={`/shop/${category.slug}/${subcategory.slug}`}
                                onClick={handleLinkClick}
                                className="hover:underline"
                              >
                                {subcategory.name}
                              </Link>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pl-2">
                                {subcategory.product_sub_subcategories?.map((subSubcat) => (
                                  <div key={subSubcat.id}>
                                    {subSubcat.product_sub_sub_subcategories?.length > 0 ? (
                                      <Accordion type="single" collapsible>
                                        <AccordionItem value={subSubcat.id}>
                                          <AccordionTrigger className="py-1.5 text-sm">
                                            <Link
                                              to={`/shop/${category.slug}/${subcategory.slug}/${subSubcat.slug}`}
                                              onClick={handleLinkClick}
                                              className="hover:underline"
                                            >
                                              {subSubcat.name}
                                            </Link>
                                          </AccordionTrigger>
                                          <AccordionContent>
                                            <div className="space-y-1 pl-2">
                                              {subSubcat.product_sub_sub_subcategories.map((subSubSubcat) => (
                                                <Link
                                                  key={subSubSubcat.id}
                                                  to={`/shop/${category.slug}/${subcategory.slug}/${subSubcat.slug}/${subSubSubcat.slug}`}
                                                  onClick={handleLinkClick}
                                                  className="block py-1 text-sm text-muted-foreground hover:text-foreground"
                                                >
                                                  {subSubSubcat.name}
                                                </Link>
                                              ))}
                                            </div>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    ) : (
                                      <Link
                                        to={`/shop/${category.slug}/${subcategory.slug}/${subSubcat.slug}`}
                                        onClick={handleLinkClick}
                                        className="block py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                      >
                                        {subSubcat.name}
                                      </Link>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}

                      {/* Trending Items */}
                      {category.trending && category.trending.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="trending">
                            <AccordionTrigger className="py-2 text-sm font-medium">Trending</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-1 pl-2">
                                {category.trending
                                  .filter((item) => item.path)
                                  .map((item) => (
                                    <Link
                                      key={item.id}
                                      to={item.path!}
                                      onClick={handleLinkClick}
                                      className="block py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                    >
                                      {item.name}
                                    </Link>
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {/* Best Sellers */}
                      {category.bestSellers && category.bestSellers.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="bestsellers">
                            <AccordionTrigger className="py-2 text-sm font-medium">Best Sellers</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-1 pl-2">
                                {category.bestSellers
                                  .filter((item) => item.path)
                                  .map((item) => (
                                    <Link
                                      key={item.id}
                                      to={item.path!}
                                      onClick={handleLinkClick}
                                      className="block py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                    >
                                      {item.name}
                                    </Link>
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {/* Luxury Brands */}
                      {category.luxuryBrands && category.luxuryBrands.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="luxury">
                            <AccordionTrigger className="py-2 text-sm font-medium">Luxury Brands</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-1 pl-2">
                                {category.luxuryBrands.map((brandItem) => (
                                  <Link
                                    key={brandItem.brand_id}
                                    to={`/shop/${category.slug}?brand=${brandItem.brands.name}`}
                                    onClick={handleLinkClick}
                                    className="block py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                  >
                                    {brandItem.brands.name}
                                  </Link>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MobileCategoryNav;
