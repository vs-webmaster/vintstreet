import { memo, useState } from 'react';
import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  showInTopLine?: boolean;
  options: string[];
}

interface DefaultFilterSettings {
  categories?: boolean;
  brand?: boolean;
  colour?: boolean;
  size?: boolean;
}

interface DefaultFilterEnabledSettings {
  categories?: boolean;
  brand?: boolean;
  colour?: boolean;
  size?: boolean;
}

interface HorizontalFiltersProps {
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
  selectedSort: string;
  sortOptions: Array<{ label: string; value: string }>;
  isMainShopPage: boolean;
  attributeFilters?: DynamicFilterAttribute[];
  selectedAttributes?: Map<string, Set<string>>;
  defaultFiltersEnabled?: DefaultFilterEnabledSettings;
  defaultFiltersTopLine?: DefaultFilterSettings;
  onCategoryChange: (categoryId: string, checked: boolean) => void;
  onBrandChange: (brandId: string, checked: boolean) => void;
  onColorChange: (color: string, checked: boolean) => void;
  onSizeChange: (size: string, checked: boolean) => void;
  onPriceRangeChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onAttributeChange?: (attributeId: string, value: string, checked: boolean) => void;
}

export const HorizontalFilters = memo(
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
    selectedPriceRange,
    priceRanges,
    selectedSort,
    sortOptions,
    isMainShopPage,
    attributeFilters = [],
    selectedAttributes = new Map(),
    defaultFiltersEnabled = {},
    defaultFiltersTopLine = {},
    onCategoryChange,
    onBrandChange,
    onColorChange,
    onSizeChange,
    onPriceRangeChange,
    onSortChange,
    onAttributeChange,
  }: HorizontalFiltersProps) => {
    const [showMoreFilters, setShowMoreFilters] = useState(false);

    // Split attribute filters into top line and more filters
    const topLineAttributeFilters = attributeFilters.filter((attr) => attr.showInTopLine);
    const moreAttributeFilters = attributeFilters.filter((attr) => !attr.showInTopLine);

    // Determine which default filters are enabled and where they go
    const isCategoriesEnabled = defaultFiltersEnabled.categories ?? false;
    const isBrandEnabled = defaultFiltersEnabled.brand ?? false;
    const isColourEnabled = defaultFiltersEnabled.colour ?? false;
    const isSizeEnabled = defaultFiltersEnabled.size ?? false;

    const showCategoriesTopLine = isCategoriesEnabled && (defaultFiltersTopLine.categories ?? false);
    const showBrandTopLine = isBrandEnabled && (defaultFiltersTopLine.brand ?? false);
    const showColourTopLine = isColourEnabled && (defaultFiltersTopLine.colour ?? false);
    const showSizeTopLine = isSizeEnabled && (defaultFiltersTopLine.size ?? false);

    const getSortLabel = () => {
      const sort = sortOptions.find((s) => s.value === selectedSort);
      return sort?.label || 'Sort';
    };

    const getPriceRangeLabel = () => {
      const range = priceRanges.find((r) => r.value === selectedPriceRange);
      return range?.label || 'Price';
    };

    const activeAttributeCount = Array.from(selectedAttributes.values()).reduce(
      (sum, set) => sum + set.size,
      0
    );

    // Sort sizes: numbers first, then standard sizes (XS-XXXL), then W-prefixed
    const sortSizes = (sizes: string[]) => {
      const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
      
      return [...sizes].sort((a, b) => {
        // Pure numbers (e.g., "30", "32")
        const isANumber = /^\d+$/.test(a);
        const isBNumber = /^\d+$/.test(b);
        
        if (isANumber && isBNumber) {
          return parseInt(a) - parseInt(b);
        }
        
        // Numbers with slashes (e.g., "32/34")
        const isASlash = /^\d+\/\d+$/.test(a);
        const isBSlash = /^\d+\/\d+$/.test(b);
        
        if (isASlash && isBSlash) {
          return parseInt(a.split('/')[0]) - parseInt(b.split('/')[0]);
        }
        
        // Standard sizes (XS, S, M, L, etc.)
        const isAStandard = sizeOrder.includes(a.toUpperCase());
        const isBStandard = sizeOrder.includes(b.toUpperCase());
        
        if (isAStandard && isBStandard) {
          return sizeOrder.indexOf(a.toUpperCase()) - sizeOrder.indexOf(b.toUpperCase());
        }
        
        // W-prefixed sizes (e.g., "W30", "W34")
        const isAW = /^W\d+$/.test(a.toUpperCase());
        const isBW = /^W\d+$/.test(b.toUpperCase());
        
        if (isAW && isBW) {
          return parseInt(a.substring(1)) - parseInt(b.substring(1));
        }
        
        // Priority: numbers > slashes > standard sizes > W-prefixed > others
        if (isANumber) return -1;
        if (isBNumber) return 1;
        if (isASlash) return -1;
        if (isBSlash) return 1;
        if (isAStandard) return -1;
        if (isBStandard) return 1;
        if (isAW) return -1;
        if (isBW) return 1;
        
        return a.localeCompare(b);
      });
    };

    const sortedAvailableSizes = sortSizes(availableSizes);

    return (
      <>
        {/* Filters Row - Fixed 7 equal columns, full width */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 items-start w-full">
          {/* Sort Dropdown - Always First Column */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                {getSortLabel()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 w-48 bg-background">
              <div className="space-y-2 p-2">
                {sortOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                    <Checkbox
                      id={`sort-${option.value}`}
                      checked={selectedSort === option.value}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSortChange(option.value);
                        }
                      }}
                    />
                    <label htmlFor={`sort-${option.value}`} className="flex-1 cursor-pointer text-sm">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Level 4 Categories Dropdown - Top Line or More Filters */}
          {showCategoriesTopLine && (showLevel4Filters || showCategoryFilters) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                  Categories
                  {selectedLowestLevel.size > 0 && (
                    <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                      {selectedLowestLevel.size}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                <div className="space-y-2 p-2">
                  {(showLevel4Filters ? level4FiltersToShow : categoryFiltersToShow).map((category) => (
                    <div key={category.id} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                      <Checkbox
                        id={`horizontal-cat-${category.id}`}
                        checked={selectedLowestLevel.has(category.id)}
                        onCheckedChange={(checked) => onCategoryChange(category.id, checked as boolean)}
                      />
                      <label htmlFor={`horizontal-cat-${category.id}`} className="flex-1 cursor-pointer text-sm">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Brand Filter Dropdown - Top Line or More Filters */}
          {showBrandTopLine && availableBrands.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                  Brand
                  {selectedBrands.size > 0 && (
                    <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                      {selectedBrands.size}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                <div className="space-y-2 p-2">
                  {availableBrands.map((brand) => (
                    <div key={brand.id} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                      <Checkbox
                        id={`horizontal-brand-${brand.id}`}
                        checked={selectedBrands.has(brand.id)}
                        onCheckedChange={(checked) => onBrandChange(brand.id, checked as boolean)}
                      />
                      <label htmlFor={`horizontal-brand-${brand.id}`} className="flex-1 cursor-pointer text-sm">
                        {brand.name}
                      </label>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Color Filter Dropdown - Top Line or More Filters */}
          {showColourTopLine && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between" disabled={availableColors.length === 0}>
                  Colour
                  {selectedColors.size > 0 && (
                    <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                      {selectedColors.size}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                {availableColors.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No colours available</div>
                ) : (
                  <div className="space-y-2 p-2">
                    {availableColors.map((color) => (
                      <div key={color} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                        <Checkbox
                          id={`horizontal-color-${color}`}
                          checked={selectedColors.has(color)}
                          onCheckedChange={(checked) => onColorChange(color, checked as boolean)}
                        />
                        <label htmlFor={`horizontal-color-${color}`} className="flex-1 cursor-pointer text-sm capitalize">
                          {color}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Size Filter Dropdown - Top Line or More Filters */}
          {showSizeTopLine && availableSizes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                  Size
                  {selectedSizes.size > 0 && (
                    <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                      {selectedSizes.size}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                <div className="space-y-2 p-2">
                  {sortedAvailableSizes.map((size) => (
                    <div key={size} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                      <Checkbox
                        id={`horizontal-size-${size}`}
                        checked={selectedSizes.has(size)}
                        onCheckedChange={(checked) => onSizeChange(size, checked as boolean)}
                      />
                      <label htmlFor={`horizontal-size-${size}`} className="flex-1 cursor-pointer text-sm">
                        {size}
                      </label>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Price Range Dropdown - Always on Top Line */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                {getPriceRangeLabel()}
                {selectedPriceRange !== 'all' && (
                  <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 w-48 bg-background">
              <div className="space-y-2 p-2">
                {priceRanges.map((range) => (
                  <div key={range.value} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                    <Checkbox
                      id={`horizontal-price-${range.value}`}
                      checked={selectedPriceRange === range.value}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onPriceRangeChange(range.value);
                        } else {
                          onPriceRangeChange('all');
                        }
                      }}
                    />
                    <label htmlFor={`horizontal-price-${range.value}`} className="flex-1 cursor-pointer text-sm">
                      {range.label}
                    </label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Top Line Attribute Filters */}
          {topLineAttributeFilters.map((attr) => (
            <DynamicAttributeFilters
              key={attr.id}
              attributeFilters={[attr]}
              selectedAttributes={selectedAttributes}
              onAttributeChange={onAttributeChange!}
              variant="horizontal"
            />
          ))}

          {/* More Filters Button - Always on top line */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 gap-2 text-xs font-normal w-full justify-between"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            disabled={
              moreAttributeFilters.length === 0 && 
              !(isCategoriesEnabled && !showCategoriesTopLine) && 
              !(isBrandEnabled && !showBrandTopLine) && 
              !(isColourEnabled && !showColourTopLine) && 
              !(isSizeEnabled && !showSizeTopLine)
            }
          >
            More Filters
            {activeAttributeCount > 0 && (
              <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                {activeAttributeCount}
              </Badge>
            )}
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded More Filters Section - Fixed 7 equal columns, full width */}
        {showMoreFilters && (
          <div className="mt-1 hidden w-full md:block">
            <div className="grid grid-cols-7 gap-4 items-start w-full">
              {/* More Filters Default Filters */}
              {isCategoriesEnabled && !showCategoriesTopLine && (showLevel4Filters || showCategoryFilters) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                      Categories
                      {selectedLowestLevel.size > 0 && (
                        <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                          {selectedLowestLevel.size}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                    <div className="space-y-2 p-2">
                      {(showLevel4Filters ? level4FiltersToShow : categoryFiltersToShow).map((category) => (
                        <div key={category.id} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                          <Checkbox
                            id={`more-cat-${category.id}`}
                            checked={selectedLowestLevel.has(category.id)}
                            onCheckedChange={(checked) => onCategoryChange(category.id, checked as boolean)}
                          />
                          <label htmlFor={`more-cat-${category.id}`} className="flex-1 cursor-pointer text-sm">
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isBrandEnabled && !showBrandTopLine && availableBrands.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                      Brand
                      {selectedBrands.size > 0 && (
                        <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                          {selectedBrands.size}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                    <div className="space-y-2 p-2">
                      {availableBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                          <Checkbox
                            id={`more-brand-${brand.id}`}
                            checked={selectedBrands.has(brand.id)}
                            onCheckedChange={(checked) => onBrandChange(brand.id, checked as boolean)}
                          />
                          <label htmlFor={`more-brand-${brand.id}`} className="flex-1 cursor-pointer text-sm">
                            {brand.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isColourEnabled && !showColourTopLine && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between" disabled={availableColors.length === 0}>
                      Colour
                      {selectedColors.size > 0 && (
                        <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                          {selectedColors.size}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                    {availableColors.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">No colours available</div>
                    ) : (
                      <div className="space-y-2 p-2">
                        {availableColors.map((color) => (
                          <div key={color} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                            <Checkbox
                              id={`more-color-${color}`}
                              checked={selectedColors.has(color)}
                              onCheckedChange={(checked) => onColorChange(color, checked as boolean)}
                            />
                            <label htmlFor={`more-color-${color}`} className="flex-1 cursor-pointer text-sm capitalize">
                              {color}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isSizeEnabled && !showSizeTopLine && availableSizes.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-normal w-full justify-between">
                      Size
                      {selectedSizes.size > 0 && (
                        <Badge variant="secondary" className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                          {selectedSizes.size}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-50 max-h-[400px] w-64 overflow-y-auto bg-background">
                    <div className="space-y-2 p-2">
                      {sortedAvailableSizes.map((size) => (
                        <div key={size} className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-muted">
                          <Checkbox
                            id={`more-size-${size}`}
                            checked={selectedSizes.has(size)}
                            onCheckedChange={(checked) => onSizeChange(size, checked as boolean)}
                          />
                          <label htmlFor={`more-size-${size}`} className="flex-1 cursor-pointer text-sm">
                            {size}
                          </label>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* More Filters Attribute Filters */}
              {moreAttributeFilters.length > 0 && (
                <DynamicAttributeFilters
                  attributeFilters={moreAttributeFilters}
                  selectedAttributes={selectedAttributes}
                  onAttributeChange={onAttributeChange!}
                  variant="horizontal"
                />
              )}
            </div>
          </div>
        )}
      </>
    );
  },
);

HorizontalFilters.displayName = 'HorizontalFilters';
