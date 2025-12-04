/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { buildCategoryHierarchy, buildCategoryLevelMaps } from '@/lib/categoryHierarchyUtils';
import { filterByCategoryId } from '@/lib/filterUtils';
import { fetchFooterColumns, fetchFooterLinks } from '@/services/content';
import {
  fetchCategories,
  fetchAllSubcategories,
  fetchAllSubSubcategories,
  fetchAllSubSubSubcategories,
} from '@/services/categories';
import {
  fetchMegaMenuLayouts,
  fetchAllMegaMenuImages,
  fetchMegaMenuCategoryBrands,
  fetchMegaMenuTrendingItems,
  fetchMegaMenuBestSellers,
  fetchMegaMenuLuxuryBrands,
  fetchMegaMenuCustomLists,
  fetchMegaMenuCustomListItems,
} from '@/services/megaMenu';
import { fetchSiteContent, fetchPromoMessage, type SiteContent } from '@/services/settings';
import { isFailure } from '@/types/api';

interface FooterColumn {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

interface FooterLink {
  id: string;
  column_id: string;
  label: string;
  url: string;
  display_order: number;
  is_active: boolean;
}

// MegaMenuNav Types
interface Brand {
  id: string;
  name: string;
}

interface CategoryBrand {
  brand_id: string;
  brands: Brand;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  disable_main_link?: boolean;
  layout?: unknown;
  brands: CategoryBrand[];
  product_subcategories: ProductSubcategory[];
  trending: unknown[];
  bestSellers: unknown[];
  luxuryBrands: CategoryBrand[];
  customLists: unknown[];
  images: unknown[];
}

interface ProductSubcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  show_in_mega_menu?: boolean;
  product_sub_subcategories?: ProductSubSubcategory[];
}

interface ProductSubSubcategory {
  id: string;
  name: string;
  slug: string;
  subcategory_id: string;
  show_in_mega_menu?: boolean;
  product_sub_sub_subcategories?: ProductSubSubSubcategory[];
}

interface ProductSubSubSubcategory {
  id: string;
  name: string;
  slug: string;
  sub_subcategory_id: string;
}

interface AppContextType {
  siteContent: SiteContent | null;
  promoMessage: string | null;
  footerColumns: FooterColumn[];
  footerLinks: FooterLink[];
  megaMenuCategories: ProductCategory[];
  megaMenuCustomLists: unknown[];
  megaMenuCustomListItems: unknown[];
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(false);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [promoMessage, setPromoMessage] = useState<string>('Free UK Shipping when you spend £60 or more');
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [megaMenuCategories, setMegaMenuCategories] = useState<ProductCategory[]>([]);
  const [megaMenuCustomLists, setMegaMenuCustomLists] = useState<any[]>([]);
  const [megaMenuCustomListItems, setMegaMenuCustomListItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSiteContentAsync = async () => {
    const result = await fetchSiteContent();
    if (isFailure(result)) throw result.error;
    setSiteContent(result.data);
  };

  const fetchPromoMessageAsync = async () => {
    const result = await fetchPromoMessage();
    if (isFailure(result)) throw result.error;
    setPromoMessage(result.data);
  };

  const fetchFooterColumnsAsync = async () => {
    const result = await fetchFooterColumns();
    if (isFailure(result)) throw result.error;
    setFooterColumns(result.data);
  };

  const fetchFooterLinksAsync = async () => {
    const result = await fetchFooterLinks();
    if (isFailure(result)) throw result.error;
    setFooterLinks(result.data);
  };

  const fetchMegaMenuDataAsync = async () => {
    const [
      catsResult,
      subsResult,
      subSubsResult,
      subSubSubsResult,
      layoutsResult,
      menuImagesResult,
      categoryBrandsResult,
      trendingResult,
      bestSellersResult,
      luxuryBrandsResult,
      customListsResult,
      customListItemsResult,
    ] = await Promise.all([
      fetchCategories(),
      fetchAllSubcategories(),
      fetchAllSubSubcategories(),
      fetchAllSubSubSubcategories(),
      fetchMegaMenuLayouts(),
      fetchAllMegaMenuImages(),
      fetchMegaMenuCategoryBrands(),
      fetchMegaMenuTrendingItems(),
      fetchMegaMenuBestSellers(),
      fetchMegaMenuLuxuryBrands(),
      fetchMegaMenuCustomLists(),
      fetchMegaMenuCustomListItems(),
    ]);

    if (isFailure(catsResult)) throw catsResult.error;
    if (isFailure(subsResult)) throw subsResult.error;
    if (isFailure(subSubsResult)) throw subSubsResult.error;
    if (isFailure(subSubSubsResult)) throw subSubSubsResult.error;
    if (isFailure(layoutsResult)) throw layoutsResult.error;
    if (isFailure(menuImagesResult)) throw menuImagesResult.error;
    if (isFailure(categoryBrandsResult)) throw categoryBrandsResult.error;
    if (isFailure(trendingResult)) throw trendingResult.error;
    if (isFailure(bestSellersResult)) throw bestSellersResult.error;
    if (isFailure(luxuryBrandsResult)) throw luxuryBrandsResult.error;
    if (isFailure(customListsResult)) throw customListsResult.error;
    if (isFailure(customListItemsResult)) throw customListItemsResult.error;

    const cats = catsResult.data;
    const subs = subsResult.data;
    const subSubs = subSubsResult.data;
    const subSubSubs = subSubSubsResult.data;
    const layouts = layoutsResult.data;
    const menuImages = menuImagesResult.data;
    const categoryBrands = categoryBrandsResult.data;
    const trending = trendingResult.data;
    const bestSellers = bestSellersResult.data;
    const luxuryBrands = luxuryBrandsResult.data;
    const customLists = customListsResult.data;
    const customListItems = customListItemsResult.data;

    // Build maps for quick lookup (reused for both categories and custom list items)
    const { l1Map, l2Map, l3Map, l4Map } = buildCategoryLevelMaps(cats, subs, subSubs, subSubSubs);

    // Build hierarchy client-side for optimal performance
    const categories = (cats || []).map((cat) => {
      const layout = (layouts || []).find((l: unknown) => l.category_id === cat.id);
      const images = (menuImages || []).filter((img: unknown) => {
        const layoutMatch = (layouts || []).find((l: unknown) => l.category_id === cat.id);
        return layoutMatch && img.layout_id === layoutMatch.id;
      });

      return {
        ...cat,
        layout,
        images,
        brands: filterByCategoryId(categoryBrands, cat.id).map((cb) => ({
          brand_id: cb.brand_id,
          brands: cb.brands as Brand,
        })),
        trending: filterByCategoryId(trending, cat.id).map((t: unknown) => {
          const level = t.item_level;
          let itemData: unknown = { id: '', name: '', path: '' };

          if (level === 2) {
            const l2 = l2Map.get(t.subcategory_id);
            itemData = {
              id: t.subcategory_id,
              name: l2?.name,
              path: l2 ? `/shop/${cat.slug}/${l2.slug}` : undefined,
            };
          } else if (level === 3) {
            const l3 = l3Map.get(t.sub_subcategory_id);
            const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
            itemData = {
              id: t.sub_subcategory_id,
              name: l3?.name,
              path: l2 && l3 ? `/shop/${cat.slug}/${l2.slug}/${l3.slug}` : undefined,
            };
          } else if (level === 4) {
            const l4 = l4Map.get(t.sub_sub_subcategory_id);
            const l3 = l4 ? l3Map.get(l4.sub_subcategory_id) : undefined;
            const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
            itemData = {
              id: t.sub_sub_subcategory_id,
              name: l4?.name,
              path: l2 && l3 && l4 ? `/shop/${cat.slug}/${l2.slug}/${l3.slug}/${l4.slug}` : undefined,
            };
          }

          return itemData;
        }),
        bestSellers: filterByCategoryId(bestSellers, cat.id).map((bs: unknown) => {
          const level = bs.item_level;
          let itemData: unknown = { id: '', name: '', path: '' };

          if (level === 2) {
            const l2 = l2Map.get(bs.subcategory_id);
            itemData = {
              id: bs.subcategory_id,
              name: l2?.name,
              path: l2 ? `/shop/${cat.slug}/${l2.slug}` : undefined,
            };
          } else if (level === 3) {
            const l3 = l3Map.get(bs.sub_subcategory_id);
            const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
            itemData = {
              id: bs.sub_subcategory_id,
              name: l3?.name,
              path: l2 && l3 ? `/shop/${cat.slug}/${l2.slug}/${l3.slug}` : undefined,
            };
          } else if (level === 4) {
            const l4 = l4Map.get(bs.sub_sub_subcategory_id);
            const l3 = l4 ? l3Map.get(l4.sub_subcategory_id) : undefined;
            const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
            itemData = {
              id: bs.sub_sub_subcategory_id,
              name: l4?.name,
              path: l2 && l3 && l4 ? `/shop/${cat.slug}/${l2.slug}/${l3.slug}/${l4.slug}` : undefined,
            };
          }

          return itemData;
        }),
        luxuryBrands: filterByCategoryId(luxuryBrands, cat.id).map((lb) => ({
          brand_id: lb.brand_id,
          brands: lb.brands as Brand,
        })),
        customLists: (customLists || [])
          .filter((cl: unknown) => cl.category_id === cat.id)
          .map((cl: unknown) => ({
            id: cl.id,
            name: cl.name,
            items: (customListItems || [])
              .filter((item: unknown) => item.list_id === cl.id)
              .map((item: unknown) => ({
                id: item.id,
                name: item.name,
                url: item.url,
              })),
          })),
        product_subcategories: buildCategoryHierarchy(cat.id, subs || [], subSubs || [], subSubSubs || []),
      };
    });

    // Enhance custom list items with generated URLs and dynamic display names for category-based items
    const enhancedItems = (customListItems || []).map((item: unknown) => {
      if (item.url) {
        return { ...item, display_name: item.name };
      }

      let display_name = item.name;
      if (item.category_id && item.category_level) {
        let url = '/shop';

        if (item.category_level === 4) {
          const l4 = l4Map.get(item.category_id);
          if (l4) {
            display_name = l4.name || display_name;
            const l3 = l3Map.get(l4.sub_subcategory_id);
            if (l3) {
              const l2 = l2Map.get(l3.subcategory_id);
              if (l2) {
                const l1 = l1Map.get(l2.category_id);
                if (l1) {
                  url = `/shop/${l1.slug}/${l2.slug}/${l3.slug}/${l4.slug}`;
                }
              }
            }
          }
        } else if (item.category_level === 3) {
          const l3 = l3Map.get(item.category_id);
          if (l3) {
            display_name = l3.name || display_name;
            const l2 = l2Map.get(l3.subcategory_id);
            if (l2) {
              const l1 = l1Map.get(l2.category_id);
              if (l1) {
                url = `/shop/${l1.slug}/${l2.slug}/${l3.slug}`;
              }
            }
          }
        } else if (item.category_level === 2) {
          const l2 = l2Map.get(item.category_id);
          if (l2) {
            display_name = l2.name || display_name;
            const l1 = l1Map.get(l2.category_id);
            if (l1) {
              url = `/shop/${l1.slug}/${l2.slug}`;
            }
          }
        } else if (item.category_level === 1) {
          const l1 = l1Map.get(item.category_id);
          if (l1) {
            display_name = l1.name || display_name;
            url = `/shop/${l1.slug}`;
          }
        }

        return { ...item, url, display_name };
      }

      return { ...item, display_name };
    });

    // Set all state values
    setMegaMenuCategories(categories);
    setMegaMenuCustomLists(customLists);
    setMegaMenuCustomListItems(enhancedItems);
  };

  useEffect(() => {
    if (ref.current) return;
    Promise.all([
      fetchSiteContentAsync(),
      fetchPromoMessageAsync(),
      fetchFooterColumnsAsync(),
      fetchFooterLinksAsync(),
      fetchMegaMenuDataAsync(),
    ])
      .catch((error) => {
        console.error('Error fetching app data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
    ref.current = true;
  }, []);

  const value = {
    siteContent,
    promoMessage,
    footerColumns,
    footerLinks,
    megaMenuCategories,
    megaMenuCustomLists,
    megaMenuCustomListItems,
    loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
