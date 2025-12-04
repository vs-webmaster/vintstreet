import { memo } from 'react';
import { X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterCategory {
  id: string;
  name: string;
  level?: number;
  allIds?: string[];
}

interface Brand {
  id: string;
  name: string;
}

interface MobileFilterDialogProps {
  show: boolean;
  onClose: () => void;
  showCategoryFilters: boolean;
  showLevel4Filters: boolean;
  categoryFiltersToShow: FilterCategory[];
  level4FiltersToShow: FilterCategory[];
  availableBrands: Brand[];
  availableColors: string[];
  availableSizes: string[];
  selectedLowestLevel: Set<string>;
  selectedBrands: Set<string>;
  selectedColors: Set<string>;
  selectedSizes: Set<string>;
  selectedPriceRange: string;
  priceRanges: Array<{ label: string; value: string }>;
  isMainShopPage: boolean;
  onCategoryChange: (categoryId: string, checked: boolean) => void;
  onBrandChange: (brandId: string, checked: boolean) => void;
  onColorChange: (color: string, checked: boolean) => void;
  onSizeChange: (size: string, checked: boolean) => void;
  onPriceRangeChange: (value: string) => void;
  onClearAll: () => void;
}

export const MobileFilterDialog = memo(
  ({
    show,
    onClose,
    showCategoryFilters,
    showLevel4Filters,
    categoryFiltersToShow,
    level4FiltersToShow,
    availableBrands,
    availableColors,
    availableSizes,
    selectedLowestLevel,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedPriceRange,
    priceRanges,
    isMainShopPage,
    onCategoryChange,
    onBrandChange,
    onColorChange,
    onSizeChange,
    onPriceRangeChange,
    onClearAll,
  }: MobileFilterDialogProps) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 z-50 bg-background md:hidden">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Active Filters Display */}
            {(selectedBrands.size > 0 ||
              selectedColors.size > 0 ||
              selectedSizes.size > 0 ||
              selectedLowestLevel.size > 0 ||
              selectedPriceRange !== 'all') && (
              <div className="mb-4 rounded-lg bg-muted/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">Active Filters</span>
                  <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs">
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Selected Categories */}
                  {Array.from(selectedLowestLevel).map((catId) => {
                    const category = (showLevel4Filters ? level4FiltersToShow : categoryFiltersToShow).find(
                      (c) => c.id === catId,
                    );
                    if (!category) return null;
                    return (
                      <Badge key={catId} variant="secondary" className="gap-2 pr-1">
                        {category.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => onCategoryChange(catId, false)}
                        />
                      </Badge>
                    );
                  })}

                  {/* Selected Brands */}
                  {Array.from(selectedBrands).map((brandId) => {
                    const brand = availableBrands.find((b) => b.id === brandId);
                    if (!brand) return null;
                    return (
                      <Badge key={brandId} variant="secondary" className="gap-2 pr-1">
                        {brand.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => onBrandChange(brandId, false)}
                        />
                      </Badge>
                    );
                  })}

                  {/* Selected Colors */}
                  {Array.from(selectedColors).map((color) => (
                    <Badge key={color} variant="secondary" className="gap-2 pr-1">
                      {color}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => onColorChange(color, false)}
                      />
                    </Badge>
                  ))}

                  {/* Selected Sizes */}
                  {Array.from(selectedSizes).map((size) => (
                    <Badge key={size} variant="secondary" className="gap-2 pr-1">
                      {size}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => onSizeChange(size, false)}
                      />
                    </Badge>
                  ))}

                  {/* Price Range */}
                  {selectedPriceRange !== 'all' && (
                    <Badge variant="secondary" className="gap-2 pr-1">
                      {priceRanges.find((r) => r.value === selectedPriceRange)?.label}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => onPriceRangeChange('all')}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={onClearAll} className="mb-4 w-full">
              Clear All Filters
            </Button>

            <Accordion type="multiple" className="space-y-2" defaultValue={['categories', 'level4']}>
              {/* Category Filters */}
              {showCategoryFilters && (
                <AccordionItem value="categories" className="border-b pb-2">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-2">
                      <span className="text-sm font-semibold">{isMainShopPage ? 'Main Categories' : 'Categories'}</span>
                      {selectedLowestLevel.size > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedLowestLevel.size}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {categoryFiltersToShow.map((category) => (
                        <div key={category.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`mobile-category-${category.id}`}
                            checked={selectedLowestLevel.has(category.id)}
                            onCheckedChange={(checked) => onCategoryChange(category.id, checked as boolean)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`mobile-category-${category.id}`}
                            className="flex-1 cursor-pointer text-sm leading-tight"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Level 4 Filters */}
              {showLevel4Filters && (
                <AccordionItem value="level4" className="border-b pb-2">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-2">
                      <span className="text-sm font-semibold">Subcategories</span>
                      {selectedLowestLevel.size > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedLowestLevel.size}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2 pr-3 pt-2">
                        {level4FiltersToShow.map((category) => (
                          <div key={category.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`mobile-level4-${category.id}`}
                              checked={selectedLowestLevel.has(category.id)}
                              onCheckedChange={(checked) => onCategoryChange(category.id, checked as boolean)}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`mobile-level4-${category.id}`}
                              className="flex-1 cursor-pointer text-sm leading-tight"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Brands */}
              {availableBrands.length > 0 && (
                <AccordionItem value="brands" className="border-b pb-2">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-2">
                      <span className="text-sm font-semibold">Brands</span>
                      {selectedBrands.size > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedBrands.size}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2 pr-3 pt-2">
                        {availableBrands.map((brand) => (
                          <div key={brand.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`mobile-brand-${brand.id}`}
                              checked={selectedBrands.has(brand.id)}
                              onCheckedChange={(checked) => onBrandChange(brand.id, checked as boolean)}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`mobile-brand-${brand.id}`}
                              className="flex-1 cursor-pointer text-sm leading-tight"
                            >
                              {brand.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <AccordionItem value="sizes" className="border-b pb-2">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-2">
                      <span className="text-sm font-semibold">Sizes</span>
                      {selectedSizes.size > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedSizes.size}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2 pr-3 pt-2">
                        {availableSizes.map((size) => (
                          <div key={size} className="flex items-start space-x-2">
                            <Checkbox
                              id={`mobile-size-${size}`}
                              checked={selectedSizes.has(size)}
                              onCheckedChange={(checked) => onSizeChange(size, checked as boolean)}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`mobile-size-${size}`}
                              className="flex-1 cursor-pointer text-sm leading-tight"
                            >
                              {size}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Colors */}
              {availableColors.length > 0 && (
                <AccordionItem value="colors" className="border-b pb-2">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-2">
                      <span className="text-sm font-semibold">Colors</span>
                      {selectedColors.size > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedColors.size}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2 pr-3 pt-2">
                        {availableColors.map((color) => (
                          <div key={color} className="flex items-start space-x-2">
                            <Checkbox
                              id={`mobile-color-${color}`}
                              checked={selectedColors.has(color)}
                              onCheckedChange={(checked) => onColorChange(color, checked as boolean)}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`mobile-color-${color}`}
                              className="flex-1 cursor-pointer text-sm capitalize leading-tight"
                            >
                              {color}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Price Range */}
              <AccordionItem value="price" className="border-b pb-2">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex w-full items-center justify-between pr-2">
                    <span className="text-sm font-semibold">Price Range</span>
                    {selectedPriceRange !== 'all' && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    {priceRanges.map((range) => (
                      <div key={range.value} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`mobile-price-${range.value}`}
                          checked={selectedPriceRange === range.value}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onPriceRangeChange(range.value);
                            } else {
                              onPriceRangeChange('all');
                            }
                          }}
                        />
                        <label htmlFor={`mobile-price-${range.value}`} className="flex-1 cursor-pointer text-sm">
                          {range.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>

          <div className="border-t p-4">
            <Button onClick={onClose} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

MobileFilterDialog.displayName = 'MobileFilterDialog';
