import { memo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DynamicAttributeFilters } from './DynamicAttributeFilters';

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

interface DynamicFilterAttribute {
  id: string;
  name: string;
  display_label: string;
  options: string[];
}

interface ShopFiltersProps {
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
  priceRange: string;
  priceRanges: Array<{ label: string; value: string }>;
  isMainShopPage: boolean;
  attributeFilters?: DynamicFilterAttribute[];
  selectedAttributes?: Map<string, Set<string>>;
  onCategoryChange: (categoryId: string, checked: boolean) => void;
  onBrandChange: (brandId: string, checked: boolean) => void;
  onColorChange: (color: string, checked: boolean) => void;
  onSizeChange: (size: string, checked: boolean) => void;
  onPriceRangeChange: (value: string) => void;
  onAttributeChange?: (attributeId: string, value: string, checked: boolean) => void;
}

export const ShopFilters = memo(
  ({
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
    priceRange,
    priceRanges,
    isMainShopPage,
    attributeFilters = [],
    selectedAttributes = new Map(),
    onCategoryChange,
    onBrandChange,
    onColorChange,
    onSizeChange,
    onPriceRangeChange,
    onAttributeChange,
  }: ShopFiltersProps) => {
    return (
      <aside className="hidden w-64 flex-shrink-0 md:block">
        <div className="sticky top-24">
          <Accordion
            type="multiple"
            className="space-y-2"
            defaultValue={[
              'categories',
              'level4',
              'brands',
              'sizes',
              'colors',
              'price',
              ...attributeFilters.map((attr) => attr.id),
            ]}
          >
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
                          id={`category-${category.id}`}
                          checked={selectedLowestLevel.has(category.id)}
                          onCheckedChange={(checked) => onCategoryChange(category.id, checked as boolean)}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={`category-${category.id}`}
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
                            id={`level4-${category.id}`}
                            checked={selectedLowestLevel.has(category.id)}
                            onCheckedChange={(checked) => onCategoryChange(category.id, checked as boolean)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`level4-${category.id}`}
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
                            id={`brand-${brand.id}`}
                            checked={selectedBrands.has(brand.id)}
                            onCheckedChange={(checked) => onBrandChange(brand.id, checked as boolean)}
                            className="mt-0.5"
                          />
                          <label htmlFor={`brand-${brand.id}`} className="flex-1 cursor-pointer text-sm leading-tight">
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
                            id={`size-${size}`}
                            checked={selectedSizes.has(size)}
                            onCheckedChange={(checked) => onSizeChange(size, checked as boolean)}
                            className="mt-0.5"
                          />
                          <label htmlFor={`size-${size}`} className="flex-1 cursor-pointer text-sm leading-tight">
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
                            id={`color-${color}`}
                            checked={selectedColors.has(color)}
                            onCheckedChange={(checked) => onColorChange(color, checked as boolean)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`color-${color}`}
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
                  {priceRange !== 'all' && (
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
                        id={`price-${range.value}`}
                        checked={priceRange === range.value}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onPriceRangeChange(range.value);
                          } else {
                            onPriceRangeChange('all');
                          }
                        }}
                      />
                      <label htmlFor={`price-${range.value}`} className="flex-1 cursor-pointer text-sm">
                        {range.label}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dynamic Attribute Filters */}
            {attributeFilters.length > 0 && onAttributeChange && (
              <DynamicAttributeFilters
                attributeFilters={attributeFilters}
                selectedAttributes={selectedAttributes}
                onAttributeChange={onAttributeChange}
                variant="sidebar"
              />
            )}
          </Accordion>
        </div>
      </aside>
    );
  },
);

ShopFilters.displayName = 'ShopFilters';
