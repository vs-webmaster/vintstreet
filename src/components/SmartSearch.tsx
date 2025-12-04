import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { autocomplete, getAlgoliaResults } from '@algolia/autocomplete-js';
import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';
import '@algolia/autocomplete-theme-classic';
import {
  searchClient,
  productsIndex,
  categoriesIndex,
  brandsIndex,
  brandsQuerySuggestionsIndex,
  categoriesQuerySuggestionsIndex,
  productsQuerySuggestionsIndex,
} from '@/integrations/algolia/client';
import type { AlgoliaProduct, AlgoliaCategory, AlgoliaBrand } from '@/integrations/algolia/types';
import { cn } from '@/lib/utils';

interface SmartSearchProps {
  className?: string;
}

const SmartSearch = ({ className }: SmartSearchProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Capture container ref value for cleanup
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Create recent searches plugin
    const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
      key: 'vintstreet_recent_searches',
      limit: 5,
      transformSource({ source }) {
        return {
          ...source,
          getItemUrl({ item }) {
            const recentItem = item as unknown as {
              label: string;
              query?: string;
            };
            const query = recentItem.query || recentItem.label || '';
            return `/search?q=${encodeURIComponent(query)}`;
          },
          onSelect({ item, setIsOpen }) {
            const recentItem = item as unknown as {
              label: string;
              query?: string;
            };
            const query = recentItem.query || recentItem.label || '';
            setIsOpen(false);
            navigate(`/search?q=${encodeURIComponent(query)}`);
          },
          templates: {
            header({ createElement, Fragment }) {
              return createElement(
                Fragment,
                {},
                createElement(
                  'div',
                  {
                    className: 'w-full py-2 bg-primary/5 border-b',
                  },
                  createElement(
                    'div',
                    {
                      className: 'flex items-center gap-2 px-3',
                    },
                    createElement(
                      'span',
                      {
                        className: 'text-base font-semibold text-primary uppercase',
                      },
                      'Recent Searches',
                    ),
                  ),
                ),
              );
            },
            // Use the default item template from the source
            item: source.templates.item,
          },
        };
      },
    });

    // Create brands query suggestions plugin
    const brandsQuerySuggestionsPlugin = createQuerySuggestionsPlugin({
      searchClient,
      indexName: brandsQuerySuggestionsIndex.indexName,
      getSearchParams({ state }) {
        return {
          hitsPerPage: state.query ? 3 : 5,
        };
      },
      transformSource({ source }) {
        return {
          ...source,
          getItemUrl({ item }) {
            const query = (item as { query: string }).query || '';
            return `/search?q=${encodeURIComponent(query)}`;
          },
          onSelect({ item, setIsOpen }) {
            const query = (item as { query: string }).query || '';
            setIsOpen(false);
            navigate(`/search?q=${encodeURIComponent(query)}`);
          },
          templates: {
            header({ createElement, Fragment }) {
              return createElement(
                Fragment,
                {},
                createElement(
                  'div',
                  {
                    className: 'w-full py-2 bg-primary/5 border-b',
                  },
                  createElement(
                    'div',
                    {
                      className: 'flex items-center gap-2 px-3',
                    },
                    createElement(
                      'span',
                      {
                        className: 'text-base font-semibold text-primary uppercase',
                      },
                      'Brand Suggestions',
                    ),
                  ),
                ),
              );
            },
            item: source.templates.item,
          },
        };
      },
    });

    // Create categories query suggestions plugin
    const categoriesQuerySuggestionsPlugin = createQuerySuggestionsPlugin({
      searchClient,
      indexName: categoriesQuerySuggestionsIndex.indexName,
      getSearchParams({ state }) {
        return {
          hitsPerPage: state.query ? 3 : 5,
        };
      },
      transformSource({ source }) {
        return {
          ...source,
          getItemUrl({ item }) {
            const query = (item as { query: string }).query || '';
            return `/search?q=${encodeURIComponent(query)}`;
          },
          onSelect({ item, setIsOpen }) {
            const query = (item as { query: string }).query || '';
            setIsOpen(false);
            navigate(`/search?q=${encodeURIComponent(query)}`);
          },
          templates: {
            header({ createElement, Fragment }) {
              return createElement(
                Fragment,
                {},
                createElement(
                  'div',
                  {
                    className: 'w-full py-2 bg-primary/5 border-b',
                  },
                  createElement(
                    'div',
                    {
                      className: 'flex items-center gap-2 px-3',
                    },
                    createElement(
                      'span',
                      {
                        className: 'text-base font-semibold text-primary uppercase',
                      },
                      'Category Suggestions',
                    ),
                  ),
                ),
              );
            },
            item: source.templates.item,
          },
        };
      },
    });

    // Create products query suggestions plugin
    const productsQuerySuggestionsPlugin = createQuerySuggestionsPlugin({
      searchClient,
      indexName: productsQuerySuggestionsIndex.indexName,
      getSearchParams({ state }) {
        return {
          hitsPerPage: state.query ? 3 : 5,
        };
      },
      transformSource({ source }) {
        return {
          ...source,
          getItemUrl({ item }) {
            const query = (item as { query: string }).query || '';
            return `/search?q=${encodeURIComponent(query)}`;
          },
          onSelect({ item, setIsOpen }) {
            const query = (item as { query: string }).query || '';
            setIsOpen(false);
            navigate(`/search?q=${encodeURIComponent(query)}`);
          },
          templates: {
            header({ createElement, Fragment }) {
              return createElement(
                Fragment,
                {},
                createElement(
                  'div',
                  {
                    className: 'w-full py-2 bg-primary/5 border-b',
                  },
                  createElement(
                    'div',
                    {
                      className: 'flex items-center gap-2 px-3',
                    },
                    createElement(
                      'span',
                      {
                        className: 'text-base font-semibold text-primary uppercase',
                      },
                      'Product Suggestions',
                    ),
                  ),
                ),
              );
            },
            item: source.templates.item,
          },
        };
      },
    });

    const search = autocomplete({
      container: container,
      placeholder: 'Search . . .',
      openOnFocus: true,
      // Disable full-screen mode on mobile - keep UI consistent with web
      detachedMediaQuery: '(max-width: 0px)',
      plugins: [
        brandsQuerySuggestionsPlugin,
        categoriesQuerySuggestionsPlugin,
        productsQuerySuggestionsPlugin,
        recentSearchesPlugin,
      ],
      getSources({ query }) {
        if (!query || query.length < 2) {
          return [];
        }

        // Store query for highlighting
        const searchQuery = query.toLowerCase();

        return [
          // Brands source from Algolia - appears first
          {
            sourceId: 'brands',
            getItems() {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: brandsIndex.indexName,
                    query,
                    params: {
                      hitsPerPage: 5,
                      filters: 'is_active:true',
                      attributesToSnippet: ['name:10', 'description:35'],
                      snippetEllipsisText: '...',
                    },
                  },
                ],
              });
            },
            getItemUrl({ item }) {
              const brand = item as unknown as AlgoliaBrand;
              return `/search?brand=${encodeURIComponent(brand.name.toLowerCase())}`;
            },
            onSelect({ item, setIsOpen }) {
              const brand = item as unknown as AlgoliaBrand;
              const url = `/search?brand=${encodeURIComponent(brand.name.toLowerCase())}`;
              setIsOpen(false);
              navigate(url);
            },
            templates: {
              header({ createElement, Fragment }) {
                return createElement(
                  Fragment,
                  {},
                  createElement(
                    'div',
                    {
                      className: 'w-full py-2 bg-primary/5 border-b',
                    },
                    createElement(
                      'div',
                      {
                        className: 'flex items-center gap-2 px-3',
                      },
                      createElement(
                        'span',
                        {
                          className: 'text-base font-semibold text-primary uppercase',
                        },
                        'Brands',
                      ),
                    ),
                  ),
                );
              },
              item({ item, createElement }) {
                const brand = item as unknown as AlgoliaBrand;
                const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // Helper function to highlight text
                const highlightText = (text: string) => {
                  if (!text) return [];
                  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
                  return parts.map((part, index) => {
                    if (part.toLowerCase() === searchQuery.toLowerCase()) {
                      return createElement(
                        'mark',
                        {
                          key: index,
                          className: 'font-bold bg-yellow-200 dark:bg-yellow-800',
                        },
                        part,
                      );
                    }
                    return part;
                  });
                };

                const brandName = brand.name || '';

                return createElement(
                  'div',
                  { className: 'aa-ItemWrapper' },
                  createElement(
                    'div',
                    { className: 'aa-ItemContent' },
                    brand.logo_url &&
                      createElement(
                        'div',
                        {
                          className: 'aa-ItemIcon aa-ItemIcon--alignTop',
                        },
                        createElement('img', {
                          src: brand.logo_url,
                          alt: brand.name,
                          width: 40,
                          height: 40,
                          className: 'rounded',
                        }),
                      ),
                    createElement(
                      'div',
                      { className: 'aa-ItemContentBody' },
                      createElement(
                        'div',
                        {
                          className: 'aa-ItemContentTitle',
                        },
                        ...highlightText(brandName),
                      ),
                      brand.description &&
                        createElement(
                          'div',
                          {
                            className: 'aa-ItemContentDescription text-sm text-muted-foreground',
                          },
                          brand.description,
                        ),
                    ),
                  ),
                );
              },
            },
          },
          // Categories source from Algolia - appears after brands
          {
            sourceId: 'categories',
            getItems() {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: categoriesIndex.indexName,
                    query,
                    params: {
                      hitsPerPage: 5,
                      filters: 'is_active:true',
                      attributesToSnippet: ['name:10', 'description:35'],
                      snippetEllipsisText: '...',
                    },
                  },
                ],
              });
            },
            getItemUrl({ item }) {
              const category = item as unknown as AlgoliaCategory;
              // Build URL using category_path (which contains slugs)
              if (category.category_path && category.category_path.length > 0) {
                return `/shop/${category.category_path.join('/')}`;
              }
              return `/shop/${category.slug}`;
            },
            onSelect({ item, setIsOpen }) {
              const category = item as unknown as AlgoliaCategory;
              // Build URL using category_path (which contains slugs)
              let url = '/shop';
              if (category.category_path && category.category_path.length > 0) {
                url += '/' + category.category_path.join('/');
              } else {
                url += '/' + category.slug;
              }
              setIsOpen(false);
              navigate(url);
            },
            templates: {
              header({ createElement, Fragment }) {
                return createElement(
                  Fragment,
                  {},
                  createElement(
                    'div',
                    {
                      className: 'w-full py-2 bg-primary/5 border-b',
                    },
                    createElement(
                      'div',
                      {
                        className: 'flex items-center gap-2 px-3',
                      },
                      createElement(
                        'span',
                        {
                          className: 'text-base font-semibold text-primary uppercase',
                        },
                        'Categories',
                      ),
                    ),
                  ),
                );
              },
              item({ item, createElement }) {
                const category = item as unknown as AlgoliaCategory;
                const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // Helper function to highlight text
                const highlightText = (text: string) => {
                  if (!text) return [];
                  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
                  return parts.map((part, index) => {
                    if (part.toLowerCase() === searchQuery.toLowerCase()) {
                      return createElement(
                        'mark',
                        {
                          key: index,
                          className: 'font-bold bg-yellow-200 dark:bg-yellow-800',
                        },
                        part,
                      );
                    }
                    return part;
                  });
                };

                const categoryName = category.name || '';
                const categoryPath = category.category_path_names || category.category_path || [];

                return createElement(
                  'div',
                  { className: 'aa-ItemWrapper' },
                  createElement(
                    'div',
                    { className: 'aa-ItemContent' },
                    createElement(
                      'div',
                      { className: 'aa-ItemContentBody' },
                      createElement(
                        'div',
                        {
                          className: 'aa-ItemContentTitle',
                        },
                        ...highlightText(categoryName),
                      ),
                      categoryPath.length > 1 &&
                        createElement(
                          'div',
                          {
                            className: 'aa-ItemContentDescription text-xs text-muted-foreground',
                          },
                          categoryPath.slice(0, -1).join(' > '),
                        ),
                      category.description &&
                        createElement(
                          'div',
                          {
                            className: 'aa-ItemContentDescription text-sm text-muted-foreground',
                          },
                          category.description,
                        ),
                    ),
                  ),
                );
              },
            },
          },
          // Products source from Algolia
          {
            sourceId: 'products',
            getItems() {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: productsIndex.indexName,
                    query,
                    params: {
                      hitsPerPage: 5,
                      filters: 'status:published',
                      attributesToSnippet: ['product_name:10', 'product_description:35'],
                      snippetEllipsisText: '...',
                    },
                  },
                ],
              });
            },
            getItemUrl({ item }) {
              const product = item as unknown as AlgoliaProduct;
              return `/product/${product.slug || product.objectID}`;
            },
            onSelect({ item, setIsOpen }) {
              const product = item as unknown as AlgoliaProduct;
              const url = `/product/${product.slug || product.objectID}`;
              setIsOpen(false);
              navigate(url);
            },
            templates: {
              header({ createElement, Fragment }) {
                return createElement(
                  Fragment,
                  {},
                  createElement(
                    'div',
                    {
                      className: 'w-full py-2 bg-primary/5 border-b',
                    },
                    createElement(
                      'div',
                      {
                        className: 'flex items-center gap-2 px-3',
                      },
                      createElement(
                        'span',
                        {
                          className: 'text-base font-semibold text-primary uppercase',
                        },
                        'Products',
                      ),
                    ),
                  ),
                );
              },
              item({ item, createElement }) {
                const product = item as unknown as AlgoliaProduct;
                const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // Helper function to highlight text
                const highlightText = (text: string) => {
                  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
                  return parts.map((part, index) => {
                    if (part.toLowerCase() === searchQuery.toLowerCase()) {
                      return createElement(
                        'mark',
                        {
                          key: index,
                          className: 'font-bold bg-yellow-200 dark:bg-yellow-800',
                        },
                        part,
                      );
                    }
                    return part;
                  });
                };

                const productName = product.product_name || '';

                return createElement(
                  'div',
                  { className: 'aa-ItemWrapper' },
                  createElement(
                    'div',
                    { className: 'aa-ItemContent' },
                    product.thumbnail &&
                      createElement(
                        'div',
                        {
                          className: 'aa-ItemIcon aa-ItemIcon--alignTop',
                        },
                        createElement('img', {
                          src: product.thumbnail,
                          alt: product.product_name,
                          width: 40,
                          height: 40,
                          className: 'rounded',
                        }),
                      ),
                    createElement(
                      'div',
                      { className: 'aa-ItemContentBody' },
                      createElement(
                        'div',
                        {
                          className: 'aa-ItemContentTitle',
                        },
                        ...highlightText(productName),
                      ),
                    ),
                  ),
                );
              },
            },
          },
        ];
      },
      onSubmit({ state, setIsOpen }) {
        if (state.query) {
          setIsOpen(false);
          navigate(`/search?q=${encodeURIComponent(state.query)}`);
        }
      },
      navigator: {
        navigate({ itemUrl }) {
          if (itemUrl) {
            navigate(itemUrl);
          }
        },
      },
      insights: true,
      classNames: {
        root: 'relative w-full',
        form: 'relative',
        input: 'bg-background/10 border-border/20 text-black',
        panel: 'absolute top-full left-0 right-0 mt-2 z-[60] overflow-y-auto bg-background border shadow-lg rounded-md',
        panelLayout: 'p-0',
      },
    });

    // Add blur handler to close dropdown when input loses focus
    const handleBlur = (e: FocusEvent) => {
      // Use setTimeout to allow click events on dropdown items to fire first
      setTimeout(() => {
        // Check if focus moved to an element within the autocomplete container
        const relatedTarget = e.relatedTarget as HTMLElement;

        if (container && relatedTarget && container.contains(relatedTarget)) {
          // Focus moved to an element within the autocomplete (e.g., dropdown item)
          return;
        }

        // Focus moved outside, close the dropdown
        search.setIsOpen(false);
      }, 150);
    };

    // Wait for input to be rendered, then add blur listener
    const setupBlurHandler = () => {
      const input = container?.querySelector('input[type="search"]') as HTMLInputElement;
      if (input) {
        input.addEventListener('blur', handleBlur);
        return true;
      }
      return false;
    };

    // Try to set up immediately, or wait for input to be rendered
    let checkInputInterval: NodeJS.Timeout | null = null;
    if (!setupBlurHandler()) {
      checkInputInterval = setInterval(() => {
        if (setupBlurHandler()) {
          if (checkInputInterval) {
            clearInterval(checkInputInterval);
            checkInputInterval = null;
          }
        }
      }, 50);

      // Cleanup interval after 2 seconds if input still not found
      setTimeout(() => {
        if (checkInputInterval) {
          clearInterval(checkInputInterval);
          checkInputInterval = null;
        }
      }, 2000);
    }

    return () => {
      if (checkInputInterval) {
        clearInterval(checkInputInterval);
      }
      // Copy ref value to avoid stale closure
      const container = containerRef.current;
      if (container) {
        const inputElement = container.querySelector('input[type="search"]') as HTMLInputElement;
        if (inputElement) {
          inputElement.removeEventListener('blur', handleBlur);
        }
      }
      search.destroy();
    };
  }, [navigate]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Autocomplete will render here */}
    </div>
  );
};

export default SmartSearch;
