// Utility functions for URL-based filter state management

/**
 * Parses a comma-separated URL param string into a Set
 */
export function parseSetFromUrl(param: string | null): Set<string> {
  return param ? new Set(param.split(',')) : new Set();
}

/**
 * Updates a URL param based on a Set value
 * Sets the param if the set has values, deletes it otherwise
 */
export function syncSetToUrlParam(
  params: URLSearchParams,
  key: string,
  value: Set<string>
): void {
  if (value.size > 0) {
    params.set(key, Array.from(value).join(','));
  } else {
    params.delete(key);
  }
}

/**
 * Updates a URL param based on a string value
 * Deletes the param if value matches the default
 */
export function syncStringToUrlParam(
  params: URLSearchParams,
  key: string,
  value: string,
  defaultValue: string = 'all'
): void {
  if (value === defaultValue) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
}

/**
 * Creates initial filter state from URL search params
 */
export function createFilterStateFromUrl(searchParams: URLSearchParams) {
  return {
    selectedBrands: parseSetFromUrl(searchParams.get('brands')),
    selectedColors: parseSetFromUrl(searchParams.get('colors')),
    selectedSizes: parseSetFromUrl(searchParams.get('sizes')),
    selectedPriceRange: searchParams.get('price') || 'all',
  };
}

/**
 * Syncs common filter state to URL params
 */
export function syncFiltersToUrlParams(
  params: URLSearchParams,
  filters: {
    selectedBrands: Set<string>;
    selectedColors: Set<string>;
    selectedSizes: Set<string>;
    selectedPriceRange: string;
  }
): void {
  syncSetToUrlParam(params, 'brands', filters.selectedBrands);
  syncSetToUrlParam(params, 'colors', filters.selectedColors);
  syncSetToUrlParam(params, 'sizes', filters.selectedSizes);
  syncStringToUrlParam(params, 'price', filters.selectedPriceRange, 'all');
}
