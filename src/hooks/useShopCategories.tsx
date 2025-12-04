// Shop Categories Hook
// Handles category hierarchy fetching and resolution for shop pages

import { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchCategories,
  fetchSubcategories,
  fetchSubSubcategories,
  fetchSubSubSubcategories,
  fetchLevel3CategoriesForDisplay,
  fetchCategoryGridImages,
  fetchCategoryByIdOrSlug,
  fetchSubcategoryByIdOrSlug,
} from '@/services/categories';
import { fetchFeaturedTags } from '@/services/tags';
import { isFailure } from '@/types/api';

interface Category {
  id: string;
  name: string;
  icon: string;
  is_active: boolean;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  is_active: boolean;
  slug: string;
}

interface SubSubcategory {
  id: string;
  name: string;
  subcategory_id: string;
  is_active: boolean;
  slug: string;
}

interface SubSubSubcategory {
  id: string;
  name: string;
  sub_subcategory_id: string;
  is_active: boolean;
  slug: string;
}

interface Level3DisplayCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  subcategory_id: string;
  show_in_category_grid: boolean;
  parentSlug: string;
}

interface UseShopCategoriesProps {
  categorySlug?: string;
  subcategorySlug?: string;
  subSubcategorySlug?: string;
}

export function useShopCategories({ categorySlug, subcategorySlug, subSubcategorySlug }: UseShopCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeSubSubcategory, setActiveSubSubcategory] = useState<string | null>(null);

  // Page type flags
  const isCategoryPage = !!categorySlug && !subcategorySlug;
  const isSubcategoryPage = !!subcategorySlug && !subSubcategorySlug;
  const isSubSubcategoryPage = !!subSubcategorySlug;
  const isMainShopPage = !categorySlug && !subcategorySlug && !subSubcategorySlug;

  // Fetch featured tags
  const { data: featuredTags = [] } = useQuery({
    queryKey: ['featured-tags', activeCategory],
    queryFn: async () => {
      const result = await fetchFeaturedTags(activeCategory || undefined);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch all categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  // Resolve category from slug
  const categoryFromSlug = useMemo(() => {
    if (!categorySlug) return null;
    return categories.find((cat) => cat.slug === categorySlug);
  }, [categories, categorySlug]);

  // Fetch subcategories for active category
  const { data: subcategories = [] } = useQuery({
    queryKey: ['product-subcategories', activeCategory],
    queryFn: async () => {
      if (!activeCategory) return [];
      const result = await fetchSubcategories(activeCategory);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!activeCategory,
    staleTime: 1000 * 60 * 30,
  });

  // Fetch Level 3 categories for category page display
  const { data: level3CategoriesForDisplay = [] } = useQuery({
    queryKey: ['level3-categories-display', activeCategory],
    queryFn: async () => {
      if (!activeCategory) return [];
      const result = await fetchLevel3CategoriesForDisplay(activeCategory);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!activeCategory && isCategoryPage,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch category grid images
  const { data: categoryGridImages = [] } = useQuery({
    queryKey: ['category-grid-images', activeCategory],
    queryFn: async () => {
      if (!activeCategory) return [];
      const result = await fetchCategoryGridImages(activeCategory);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!activeCategory && isCategoryPage,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch sub-subcategories
  const { data: subSubcategories = [] } = useQuery({
    queryKey: ['product-sub-subcategories', activeSubcategory],
    queryFn: async () => {
      if (!activeSubcategory) return [];
      const result = await fetchSubSubcategories(activeSubcategory);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!activeSubcategory,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch Level 4 categories
  const { data: level4Categories = [] } = useQuery({
    queryKey: ['product-sub-sub-subcategories', activeSubSubcategory],
    queryFn: async () => {
      if (!activeSubSubcategory) return [];
      const result = await fetchSubSubSubcategories(activeSubSubcategory);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!activeSubSubcategory,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch Level 1 category name for breadcrumb
  const { data: level1CategoryName } = useQuery({
    queryKey: ['level1-category-name', activeCategory, activeSubcategory, activeSubSubcategory],
    queryFn: async () => {
      if (isSubcategoryPage && activeSubcategory) {
        const subcategory = subcategories.find((s) => s.id === activeSubcategory);
        if (subcategory?.category_id) {
          const result = await fetchCategoryByIdOrSlug(subcategory.category_id);
          if (result.success && result.data) {
            return result.data.name || null;
          }
        }
      }

      if (isSubSubcategoryPage && activeSubSubcategory) {
        const subSubcategory = subSubcategories.find((ss) => ss.id === activeSubSubcategory);
        if (subSubcategory?.subcategory_id) {
          const subcategoryResult = await fetchSubcategoryByIdOrSlug(subSubcategory.subcategory_id);
          if (subcategoryResult.success && subcategoryResult.data?.category_id) {
            const categoryResult = await fetchCategoryByIdOrSlug(subcategoryResult.data.category_id);
            if (categoryResult.success && categoryResult.data) {
              return categoryResult.data.name || null;
            }
          }
        }
      }

      return null;
    },
    enabled: isSubcategoryPage || isSubSubcategoryPage,
    staleTime: 1000 * 60 * 10,
  });

  // Compute lowest level categories for filters
  const lowestLevelCategories = useMemo(() => {
    if (isSubSubcategoryPage && level4Categories.length > 0) {
      return level4Categories.map((cat) => ({ id: cat.id, name: cat.name, level: 4 as const }));
    }
    if (isSubcategoryPage && subSubcategories.length > 0) {
      return subSubcategories.map((cat) => ({ id: cat.id, name: cat.name, level: 3 as const }));
    }
    if (isCategoryPage && subcategories.length > 0) {
      return subcategories.map((cat) => ({ id: cat.id, name: cat.name, level: 2 as const }));
    }
    return [];
  }, [subcategories, subSubcategories, level4Categories, isCategoryPage, isSubcategoryPage, isSubSubcategoryPage]);

  // Sync active category from slug
  useEffect(() => {
    if (categoryFromSlug) {
      setActiveCategory(categoryFromSlug.id);
    } else if (categorySlug && !categoryFromSlug) {
      setActiveCategory(null);
    } else if (!categorySlug) {
      setActiveCategory(null);
    }
  }, [categoryFromSlug, categorySlug]);

  // Sync active subcategory from slug
  useEffect(() => {
    if (subcategorySlug && subcategories.length > 0) {
      const subcat = subcategories.find((s) => s.slug === subcategorySlug);
      if (subcat) {
        setActiveSubcategory(subcat.id);
      }
    } else {
      setActiveSubcategory(null);
    }
  }, [subcategorySlug, subcategories]);

  // Sync active sub-subcategory from slug
  useEffect(() => {
    if (subSubcategorySlug && subSubcategories.length > 0) {
      const subSubcat = subSubcategories.find((ss) => ss.slug === subSubcategorySlug);
      if (subSubcat) {
        setActiveSubSubcategory(subSubcat.id);
      }
    } else {
      setActiveSubSubcategory(null);
    }
  }, [subSubcategorySlug, subSubcategories]);

  return {
    // Active IDs
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,

    // Data
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

    // Page type flags
    isCategoryPage,
    isSubcategoryPage,
    isSubSubcategoryPage,
    isMainShopPage,

    // Loading state
    categoriesLoading,
  };
}
