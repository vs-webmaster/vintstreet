// Shop Page
// Main product listing page with filters and category navigation

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Filter, X, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CachedImage } from '@/components/CachedImage';
import { MegaMenuNav } from '@/components/MegaMenuNav';
import { ProductCard, ProductSkeleton } from '@/components/product';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { FeaturedTagsNav } from '@/components/shop/FeaturedTagsNav';
import { HorizontalFilters } from '@/components/shop/HorizontalFilters';
import { MobileFilterDialog } from '@/components/shop/MobileFilterDialog';
import { NoProductsEmptyState } from '@/components/shop/NoProductsEmptyState';
import { ShopBannerCarousel } from '@/components/shop/ShopBannerCarousel';
import { ShopBrandSection } from '@/components/shop/ShopBrandSection';
import { ShopFeaturesSection } from '@/components/shop/ShopFeaturesSection';
import { ShopSections } from '@/components/shop/ShopSections';
import { ShopVideoSection } from '@/components/shop/ShopVideoSection';
import { ShopHeroImagesSection } from '@/components/shop/ShopHeroImagesSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { useShopFilters } from '@/hooks/useShopFilters';
import { useShopCategories } from '@/hooks/useShopCategories';
import { useShopProducts } from '@/hooks/useShopProducts';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useDynamicAttributeFilters } from '@/hooks/useDynamicAttributeFilters';

const priceRanges = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under £50', value: '0-50' },
  { label: '£50 - £100', value: '50-100' },
  { label: '£100 - £200', value: '100-200' },
  { label: '£200+', value: '200+' },
];

const ShopPage = () => {
  const navigate = useNavigate();
  const { categorySlug, subcategorySlug, subSubcategorySlug } = useParams();
  const { convertPrice } = useCurrency();

  // Centralized filter state
  const {
    selectedLowestLevel,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedPriceRange,
    selectedAttributes,
    sortBy,
    setSelectedLowestLevel,
    setSelectedBrands,
    setSelectedColors,
    setSelectedSizes,
    setSelectedPriceRange,
    setSortBy,
    handleCategoryChange,
    handleBrandChange,
    handleColorChange,
    handleSizeChange,
    handlePriceRangeChange,
    handleAttributeChange,
    clearAllFilters,
    hasActiveFilters,
  } = useShopFilters();

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Category data and hierarchy
  const {
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,
    categories,
    subcategories,
    subSubcategories,
    level4Categories,
    categoryFromSlug,
    level3CategoriesForDisplay,
    categoryGridImages,
    lowestLevelCategories,
    level1CategoryName,
    featuredTags,
    isCategoryPage,
    isSubcategoryPage,
    isSubSubcategoryPage,
    isMainShopPage,
    categoriesLoading,
  } = useShopCategories({ categorySlug, subcategorySlug, subSubcategorySlug });

  // Show landing page when on main shop page with no filters
  const showLandingPage = isMainShopPage && !hasActiveFilters;

  // Product filters (color, size, brands, etc.)
  const {
    colorFilteredProductIds,
    sizeFilteredProductIds,
    availableBrands,
    availableColors,
    availableSizes,
    filterSettings,
  } = useProductFilters({
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,
    isSubSubcategoryPage,
    selectedColors,
    selectedSizes,
    selectedBrands,
    selectedLowestLevel,
    colorFilteredProductIds: undefined,
    sizeFilteredProductIds: undefined,
    categoryName: categoryFromSlug?.name,
  });

  // Dynamic attribute filters
  const { attributeFilters, attributeFilteredProductIds, defaultFiltersEnabled, defaultFiltersTopLine } =
    useDynamicAttributeFilters({
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      selectedLowestLevel,
      selectedBrands,
      selectedAttributes,
      isSubSubcategoryPage,
    });

  // Determine category filters to show
  const categoryFiltersToShow = useMemo(() => {
    if (isMainShopPage) {
      return categories.map((cat) => ({ id: cat.id, name: cat.name, level: 1 as const, slug: cat.slug }));
    }
    if (isCategoryPage && subSubcategories.length > 0) {
      return subSubcategories.map((cat) => ({ id: cat.id, name: cat.name, level: 3 as const }));
    }
    return lowestLevelCategories;
  }, [isMainShopPage, categories, isCategoryPage, subSubcategories, lowestLevelCategories]);

  // Products with infinite scroll
  const { products: allProducts, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useShopProducts({
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,
    isMainShopPage,
    isSubSubcategoryPage,
    showLandingPage,
    isCategoryPage,
    hasActiveFilters,
    selectedLowestLevel,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedAttributes,
    colorFilteredProductIds,
    sizeFilteredProductIds,
    attributeFilteredProductIds,
    categoryFiltersToShow,
    sortBy,
  });

  // Recently viewed and recommendations
  const { recentlyViewedProducts, recommendedProducts } = useRecentlyViewed({
    enabled: showLandingPage || isCategoryPage,
  });

  // Reset filters when navigating between categories
  useEffect(() => {
    setSelectedLowestLevel(new Set());
    setSelectedBrands(new Set());
    setSelectedColors(new Set());
    setSelectedSizes(new Set());
    setSelectedPriceRange('all');
  }, [categorySlug, subcategorySlug, subSubcategorySlug]);

  // Price range filtering and sorting (client-side)
  const convertedPriceRanges = useMemo(
    () => ({
      range50: convertPrice(50),
      range100: convertPrice(100),
      range200: convertPrice(200),
    }),
    [convertPrice],
  );

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (selectedPriceRange === 'all') return true;
      const convertedPrice = convertPrice(product.starting_price);

      switch (selectedPriceRange) {
        case '0-50':
          return convertedPrice < convertedPriceRanges.range50;
        case '50-100':
          return convertedPrice >= convertedPriceRanges.range50 && convertedPrice < convertedPriceRanges.range100;
        case '100-200':
          return convertedPrice >= convertedPriceRanges.range100 && convertedPrice < convertedPriceRanges.range200;
        case '200+':
          return convertedPrice >= convertedPriceRanges.range200;
        default:
          return true;
      }
    });
  }, [allProducts, selectedPriceRange, convertPrice, convertedPriceRanges]);

  const sortedProducts = useMemo(
    () =>
      [...filteredProducts].sort((a, b) => {
        const priceA = a.discounted_price || a.starting_price;
        const priceB = b.discounted_price || b.starting_price;

        switch (sortBy) {
          case 'price-low':
            return priceA - priceB;
          case 'price-high':
            return priceB - priceA;
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'featured':
          default:
            return 0;
        }
      }),
    [filteredProducts, sortBy],
  );

  const showCategoryFilters =
    isMainShopPage ||
    (isCategoryPage && subSubcategories.length > 0) ||
    (isSubcategoryPage && lowestLevelCategories.length > 0) ||
    (isSubSubcategoryPage && level4Categories.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <Suspense fallback={<div className="h-12 bg-muted/20" />}>
        <MegaMenuNav />
      </Suspense>

      <FeaturedTagsNav tags={featuredTags} />

      {/* Landing Page Sections */}
      {showLandingPage && <ShopHeroImagesSection />}
      {showLandingPage && <ShopBannerCarousel />}
      {showLandingPage && <ShopFeaturesSection />}
      {showLandingPage && <ShopVideoSection />}
      {showLandingPage && <ShopBrandSection />}

      <main className="px-1 py-4 md:px-2">
        <div className="w-full">
          {/* Title, Sort and Filters Bar */}
          {!showLandingPage && (
            <>
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-4">
                  {isCategoryPage && !hasActiveFilters ? (
                    <div className="w-full py-8 text-center">
                      <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                        {categoryFromSlug?.name || 'Shop Products'}
                      </h2>
                    </div>
                  ) : (
                    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
                      <div className="min-w-[200px]">
                        <h2 className="text-2xl font-bold text-foreground">
                          {level1CategoryName && (isSubcategoryPage || isSubSubcategoryPage) && (
                            <>
                              <span className="text-muted-foreground">{level1CategoryName}</span>
                              <span className="mx-2 text-muted-foreground">{'>'}</span>
                            </>
                          )}
                          {isSubSubcategoryPage && subSubcategories.length > 0
                            ? subSubcategories.find((ss) => ss.id === activeSubSubcategory)?.name || 'Shop Products'
                            : isSubcategoryPage && subcategories.length > 0
                              ? subcategories.find((s) => s.id === activeSubcategory)?.name || 'Shop Products'
                              : isCategoryPage && categoryFromSlug
                                ? categoryFromSlug.name
                                : 'Shop Products'}
                        </h2>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <HorizontalFilters
                            showCategoryFilters={showCategoryFilters}
                            showLevel4Filters={false}
                            categoryFiltersToShow={categoryFiltersToShow}
                            level4FiltersToShow={[]}
                            availableBrands={filterSettings?.show_brand_filter ? availableBrands : []}
                            availableColors={filterSettings?.show_color_filter ? availableColors : []}
                            availableSizes={filterSettings?.show_size_filter ? availableSizes : []}
                            selectedLowestLevel={selectedLowestLevel}
                            selectedBrands={selectedBrands}
                            selectedColors={selectedColors}
                            selectedSizes={selectedSizes}
                            selectedPriceRange={selectedPriceRange}
                            priceRanges={priceRanges}
                            selectedSort={sortBy}
                            sortOptions={[
                              { label: 'Featured', value: 'featured' },
                              { label: 'Price: Low to High', value: 'price-low' },
                              { label: 'Price: High to Low', value: 'price-high' },
                              { label: 'Newest', value: 'newest' },
                            ]}
                            isMainShopPage={isMainShopPage}
                            attributeFilters={attributeFilters}
                            selectedAttributes={selectedAttributes}
                            defaultFiltersEnabled={defaultFiltersEnabled}
                            defaultFiltersTopLine={defaultFiltersTopLine}
                            onCategoryChange={handleCategoryChange}
                            onBrandChange={handleBrandChange}
                            onColorChange={handleColorChange}
                            onSizeChange={handleSizeChange}
                            onPriceRangeChange={handlePriceRangeChange}
                            onSortChange={setSortBy}
                            onAttributeChange={handleAttributeChange}
                          />

                          <Button
                            variant="outline"
                            size="sm"
                            className="md:hidden"
                            onClick={() => setShowMobileFilters(true)}
                          >
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Filter Dialog */}
              <MobileFilterDialog
                show={showMobileFilters}
                onClose={() => setShowMobileFilters(false)}
                showCategoryFilters={showCategoryFilters}
                showLevel4Filters={false}
                categoryFiltersToShow={categoryFiltersToShow}
                level4FiltersToShow={[]}
                availableBrands={filterSettings?.show_brand_filter ? availableBrands : []}
                availableColors={filterSettings?.show_color_filter ? availableColors : []}
                availableSizes={filterSettings?.show_size_filter ? availableSizes : []}
                selectedLowestLevel={selectedLowestLevel}
                selectedBrands={selectedBrands}
                selectedColors={selectedColors}
                selectedSizes={selectedSizes}
                selectedPriceRange={selectedPriceRange}
                priceRanges={priceRanges}
                isMainShopPage={isMainShopPage}
                onCategoryChange={handleCategoryChange}
                onBrandChange={handleBrandChange}
                onColorChange={handleColorChange}
                onSizeChange={handleSizeChange}
                onPriceRangeChange={handlePriceRangeChange}
                onClearAll={clearAllFilters}
              />

              {/* Selected Filters Display */}
              {hasActiveFilters && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {Array.from(selectedLowestLevel).map((id) => {
                    const category = categoryFiltersToShow.find((c) => c.id === id);
                    return category ? (
                      <Badge key={id} variant="secondary" className="gap-2 pr-1">
                        {category.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleCategoryChange(id, false)}
                        />
                      </Badge>
                    ) : null;
                  })}

                  {Array.from(selectedBrands).map((brandId) => {
                    const brand = availableBrands.find((b: any) => b.id === brandId);
                    return brand ? (
                      <Badge key={brandId} variant="secondary" className="gap-2 pr-1">
                        {brand.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleBrandChange(brandId, false)}
                        />
                      </Badge>
                    ) : null;
                  })}

                  {Array.from(selectedColors).map((color) => (
                    <Badge
                      key={color}
                      className="gap-2 border-0 pr-1"
                      style={{ backgroundColor: color.toLowerCase(), color: '#ffffff' }}
                    >
                      {color}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-white/80"
                        onClick={() => handleColorChange(color, false)}
                      />
                    </Badge>
                  ))}

                  {Array.from(selectedSizes).map((size) => (
                    <Badge key={size} variant="secondary" className="gap-2 pr-1">
                      {size}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleSizeChange(size, false)}
                      />
                    </Badge>
                  ))}

                  {selectedPriceRange !== 'all' && (
                    <Badge variant="secondary" className="gap-2 pr-1">
                      {priceRanges.find((r) => r.value === selectedPriceRange)?.label}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => setSelectedPriceRange('all')}
                      />
                    </Badge>
                  )}

                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs">
                    <X className="mr-1 h-3 w-3" />
                    Clear All
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Shop Sections - Landing Page */}
          {showLandingPage && <ShopSections />}

          {/* Landing Page Content */}
          {showLandingPage ? (
            <div className="w-full space-y-16">
              {recentlyViewedProducts.length > 0 && (
                <section className="space-y-6">
                  <h2 className="text-3xl font-bold">Recently Viewed</h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
                    {recentlyViewedProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                </section>
              )}

              {recommendedProducts.length > 0 && (
                <section className="space-y-6">
                  <h2 className="text-3xl font-bold">We think you'll like</h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                    {recommendedProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="w-full">
              {isCategoryPage && !hasActiveFilters ? (
                /* Level 3 Category Cards */
                isLoading || categoriesLoading ? (
                  <div className="flex flex-wrap justify-center gap-4">
                    {[...Array(13)].map((_, i) => (
                      <div key={i} className="flex w-24 flex-col items-center space-y-2">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : level3CategoriesForDisplay.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No categories available</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap justify-center gap-4">
                      {level3CategoriesForDisplay.map((category) => (
                        <div
                          key={category.id}
                          className="flex w-24 cursor-pointer flex-col items-center space-y-2 transition-transform hover:scale-105"
                          onClick={() => navigate(`/shop/${categorySlug}/${category.parentSlug}/${category.slug}`)}
                        >
                          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
                            {category.image_url ? (
                              <CachedImage
                                src={category.image_url}
                                alt={category.name}
                                className="h-full w-full object-cover"
                                width={96}
                                height={96}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="text-sm text-muted-foreground">No image</span>
                              </div>
                            )}
                          </div>
                          <p className="text-center text-sm font-medium">{category.name}</p>
                        </div>
                      ))}
                    </div>

                    {/* Category Grid Images */}
                    {categoryGridImages.length > 0 && (
                      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {categoryGridImages.map((gridImage: any) => (
                          <div
                            key={gridImage.id}
                            className="group relative cursor-pointer overflow-hidden rounded-[10px] bg-muted"
                            onClick={() => gridImage.link && navigate(gridImage.link)}
                          >
                            {gridImage.image_url ? (
                              <CachedImage
                                src={gridImage.image_url}
                                alt={gridImage.button_text || 'Category image'}
                                className="h-full w-full rounded-[10px] object-cover transition-transform group-hover:scale-105"
                                width={400}
                                height={400}
                              />
                            ) : (
                              <div className="flex h-64 w-full items-center justify-center">
                                <span className="text-muted-foreground">No image</span>
                              </div>
                            )}
                            {gridImage.button_text && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Button variant="outline" className="w-auto px-8 py-12 text-2xl font-bold">
                                  {gridImage.button_text}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recently Viewed on Category Page */}
                    {recentlyViewedProducts.length > 0 && (
                      <section className="mt-16 space-y-6">
                        <h2 className="text-3xl font-bold">Recently Viewed</h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
                          {recentlyViewedProducts.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Recommendations on Category Page */}
                    {recommendedProducts.length > 0 && (
                      <section className="mt-16 space-y-6">
                        <h2 className="text-3xl font-bold">We think you'll like</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                          {recommendedProducts.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )
              ) : (
                /* Products Grid */
                <>
                  {isLoading || categoriesLoading ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {[...Array(10)].map((_, i) => (
                        <ProductSkeleton key={i} />
                      ))}
                    </div>
                  ) : sortedProducts.length === 0 ? (
                    <NoProductsEmptyState onClearFilters={clearAllFilters} />
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {sortedProducts.map((product, index) => (
                          <ProductCard key={product.id} product={product} index={index} />
                        ))}
                      </div>

                      {hasNextPage && (
                        <div className="flex justify-center py-8">
                          <Button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            size="lg"
                            className="min-w-[200px]"
                          >
                            {isFetchingNextPage ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load More'
                            )}
                          </Button>
                        </div>
                      )}

                      {!hasNextPage && sortedProducts.length > 0 && (
                        <div className="py-8 text-center text-muted-foreground">
                          <p>You've reached the end of the list</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <Suspense fallback={<div className="h-64 bg-muted/20" />}>
        <Footer />
      </Suspense>

      <ScrollToTopButton />
    </div>
  );
};

export default ShopPage;
