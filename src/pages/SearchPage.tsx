import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { X, Loader2, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ProductCard, ProductSkeleton } from '@/components/product';
import type { ProductCardProduct } from '@/components/product/ProductCard';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { NoProductsEmptyState } from '@/components/shop/NoProductsEmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { parseSetFromUrl, syncFiltersToUrlParams } from '@/lib/urlFilterUtils';
import { fetchAttributeByNamePattern, fetchProductAttributeValuesByAttributeId } from '@/services/attributes';
import { fetchBrands } from '@/services/brands';
import { searchProducts } from '@/services/products';
import { fetchNonSuspendedSellerIds } from '@/services/users';
import { isFailure } from '@/types/api';

const PRODUCTS_PER_PAGE = 32;

// Extended type for search results with category info
interface SearchProduct extends ProductCardProduct {
  product_categories?: { name: string } | null;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('q') || '';
  const brandQuery = searchParams.get('brand'); // Brand name from URL

  const [selectedBrands, setSelectedBrandsState] = useState<Set<string>>(() =>
    parseSetFromUrl(searchParams.get('brands')),
  );
  const [selectedColors, setSelectedColorsState] = useState<Set<string>>(() =>
    parseSetFromUrl(searchParams.get('colors')),
  );
  const [selectedSizes, setSelectedSizesState] = useState<Set<string>>(() =>
    parseSetFromUrl(searchParams.get('sizes')),
  );
  const [selectedPriceRange, setSelectedPriceRangeState] = useState(() => searchParams.get('price') || 'all');
  const [sortBy, setSortBy] = useState('featured');

  const setSelectedBrands = useCallback((brands: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setSelectedBrandsState((prev) => {
      return typeof brands === 'function' ? brands(prev) : brands;
    });
  }, []);

  const setSelectedColors = useCallback((colors: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setSelectedColorsState((prev) => {
      return typeof colors === 'function' ? colors(prev) : colors;
    });
  }, []);

  const setSelectedSizes = useCallback((sizes: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setSelectedSizesState((prev) => {
      return typeof sizes === 'function' ? sizes(prev) : sizes;
    });
  }, []);

  const setSelectedPriceRange = useCallback((value: string | ((prev: string) => string)) => {
    setSelectedPriceRangeState((prev) => {
      return typeof value === 'function' ? value(prev) : value;
    });
  }, []);

  // Sync URL params with state changes
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);

        // Preserve search query
        if (searchQuery) {
          if (searchQuery.trim().length > 0) {
            newParams.set('q', searchQuery);
          } else {
            newParams.delete('q');
          }
        }

        if (brandQuery) {
          if (brandQuery.trim().length > 0) {
            newParams.set('brand', brandQuery);
          } else {
            newParams.delete('brand');
          }
        }

        // Sync common filters to URL
        syncFiltersToUrlParams(newParams, {
          selectedBrands,
          selectedColors,
          selectedSizes,
          selectedPriceRange,
        });

        return newParams;
      },
      { replace: true },
    );
  }, [selectedBrands, selectedColors, selectedSizes, selectedPriceRange, searchQuery, brandQuery, setSearchParams]);

  // Fetch brands for filtering
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const result = await fetchBrands({ isActive: true });
      if (isFailure(result)) throw result.error;
      return result.data.map((b) => ({ id: b.id, name: b.name }));
    },
    staleTime: 1000 * 60 * 30,
  });

  // Fetch color attribute
  const { data: colourAttribute } = useQuery({
    queryKey: ['colour-attribute'],
    queryFn: async () => {
      const result = await fetchAttributeByNamePattern('colour');
      if (isFailure(result)) {
        // Try 'color' as fallback
        const colorResult = await fetchAttributeByNamePattern('color');
        if (isFailure(colorResult)) throw colorResult.error;
        return colorResult.data;
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch size attribute
  const { data: sizeAttribute } = useQuery({
    queryKey: ['size-attribute'],
    queryFn: async () => {
      const result = await fetchAttributeByNamePattern('size');
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch color-filtered product IDs
  const { data: colorFilteredProductIds } = useQuery({
    queryKey: ['color-filtered-products', Array.from(selectedColors).sort(), colourAttribute?.id],
    enabled: selectedColors.size > 0 && !!colourAttribute?.id,
    queryFn: async () => {
      if (selectedColors.size === 0 || !colourAttribute?.id) return null;

      const result = await fetchProductAttributeValuesByAttributeId(colourAttribute.id);
      if (isFailure(result)) throw result.error;

      const normalizedFilters = Array.from(selectedColors).map((c) => c.trim().toLowerCase());
      const matchingProductIds = new Set<string>();

      result.data.forEach((pav) => {
        if (!pav.value_text) return;

        let values: string[] = [];
        try {
          const parsed = JSON.parse(pav.value_text);
          if (Array.isArray(parsed)) values = parsed;
        } catch {
          values = pav.value_text.includes(',') ? pav.value_text.split(',') : [pav.value_text];
        }

        const normalized = values.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
        if (normalized.some((pc) => normalizedFilters.includes(pc))) {
          matchingProductIds.add(pav.product_id);
        }
      });

      return Array.from(matchingProductIds);
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch size-filtered product IDs
  const { data: sizeFilteredProductIds } = useQuery({
    queryKey: ['size-filtered-products', Array.from(selectedSizes).sort(), sizeAttribute?.id],
    enabled: selectedSizes.size > 0 && !!sizeAttribute?.id,
    queryFn: async () => {
      if (selectedSizes.size === 0 || !sizeAttribute?.id) return null;

      const result = await fetchProductAttributeValuesByAttributeId(sizeAttribute.id);
      if (isFailure(result)) throw result.error;

      const normalizedFilters = Array.from(selectedSizes).map((s) => s.trim().toLowerCase());
      const matchingProductIds = new Set<string>();

      result.data.forEach((pav) => {
        if (!pav.value_text) return;

        let values: string[] = [];
        try {
          const parsed = JSON.parse(pav.value_text);
          if (Array.isArray(parsed)) values = parsed;
        } catch {
          values = pav.value_text.includes(',') ? pav.value_text.split(',') : [pav.value_text];
        }

        const normalized = values.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
        if (normalized.some((ps) => normalizedFilters.includes(ps))) {
          matchingProductIds.add(pav.product_id);
        }
      });

      return Array.from(matchingProductIds);
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch non-suspended seller IDs
  const { data: nonSuspendedSellerIds = [] } = useQuery({
    queryKey: ['non-suspended-sellers'],
    queryFn: async () => {
      const result = await fetchNonSuspendedSellerIds();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch products with infinite query
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: [
      'search-products',
      searchQuery,
      brandQuery,
      Array.from(selectedBrands).sort(),
      Array.from(selectedColors).sort(),
      colorFilteredProductIds,
      Array.from(selectedSizes).sort(),
      sizeFilteredProductIds,
      selectedPriceRange,
      sortBy,
      nonSuspendedSellerIds,
    ],
    enabled:
      ((!!searchQuery && searchQuery.trim().length > 0) || (!!brandQuery && brandQuery.trim().length > 0)) &&
      nonSuspendedSellerIds.length > 0,
    queryFn: async ({ pageParam = 0 }) => {
      // Resolve brand query to brand ID if needed
      let brandIds = Array.from(selectedBrands);
      if (brandQuery.trim() && brands && brands.length > 0) {
        const brand = brands.find((b) => b.name.toLowerCase().trim() === brandQuery.toLowerCase().trim());
        if (brand) {
          brandIds = [brand.id];
        } else {
          return {
            products: [],
            total: 0,
            nextPage: undefined,
          };
        }
      }

      const result = await searchProducts({
        searchQuery,
        selectedBrands: brandIds,
        colorFilteredProductIds: colorFilteredProductIds || undefined,
        sizeFilteredProductIds: sizeFilteredProductIds || undefined,
        selectedPriceRange,
        sortBy,
        page: pageParam,
        pageSize: PRODUCTS_PER_PAGE,
        nonSuspendedSellerIds,
      });

      if (isFailure(result)) throw result.error;

      return {
        products: result.data.products as SearchProduct[],
        total: result.data.total,
        nextPage: result.data.nextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const products = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.total || 0;

  const hasActiveFilters =
    selectedBrands.size > 0 || selectedColors.size > 0 || selectedSizes.size > 0 || selectedPriceRange !== 'all';

  // Redirect to shop if no search query
  useEffect(() => {
    if (!((searchQuery && searchQuery.trim().length > 0) || (brandQuery && brandQuery.trim().length > 0))) {
      navigate('/shop');
    }
  }, [searchQuery, brandQuery, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Search Header */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold">Search Results</h1>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                {totalCount > 0 ? (
                  <>
                    Found <span className="font-semibold text-foreground">{totalCount}</span> result
                    {totalCount !== 1 ? 's' : ''} for "{searchQuery}"
                  </>
                ) : (
                  <>No results found for "{searchQuery}"</>
                )}
              </p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedBrands(new Set());
                    setSelectedColors(new Set());
                    setSelectedSizes(new Set());
                    setSelectedPriceRange('all');
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sortBy === 'featured' && 'Featured'}
                    {sortBy === 'price-low' && 'Price: Low to High'}
                    {sortBy === 'price-high' && 'Price: High to Low'}
                    {sortBy === 'newest' && 'Newest'}
                    {sortBy === 'oldest' && 'Oldest'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('featured')}>Featured</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-low')}>Price: Low to High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price-high')}>Price: High to Low</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('oldest')}>Oldest</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Simple Filters - Brand Filter */}
          {brands.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground">Brands:</span>
              {brands.slice(0, 10).map((brand) => (
                <Badge
                  key={brand.id}
                  variant={selectedBrands.has(brand.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const newBrands = new Set(selectedBrands);
                    if (newBrands.has(brand.id)) {
                      newBrands.delete(brand.id);
                    } else {
                      newBrands.add(brand.id);
                    }
                    setSelectedBrands(newBrands);
                  }}
                >
                  {brand.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <NoProductsEmptyState
              onClearFilters={() => {
                setSelectedBrands(new Set());
                setSelectedColors(new Set());
                setSelectedSizes(new Set());
                setSelectedPriceRange('all');
              }}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default SearchPage;
