// Category Query Hooks
// React Query hooks for category data

import { useQuery } from '@tanstack/react-query';
import {
  fetchCategories,
  fetchCategoryByIdOrSlug,
  fetchSubcategories,
  fetchSubSubcategories,
  fetchSubSubSubcategories,
  fetchCategoryHierarchy,
  fetchLevel3CategoriesForDisplay,
  fetchBrandsForCategory,
  type Level3DisplayCategory,
} from '@/services/categories';
import { isSuccess } from '@/types/api';

// Query key factory for categories
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (idOrSlug: string) => [...categoryKeys.details(), idOrSlug] as const,
  subcategories: (categoryId: string) => [...categoryKeys.all, 'subcategories', categoryId] as const,
  subSubcategories: (subcategoryId: string) => [...categoryKeys.all, 'sub-subcategories', subcategoryId] as const,
  level4: (subSubcategoryId: string) => [...categoryKeys.all, 'level4', subSubcategoryId] as const,
  hierarchy: (categorySlug: string, subcategorySlug?: string, subSubcategorySlug?: string) =>
    [...categoryKeys.all, 'hierarchy', categorySlug, subcategorySlug, subSubcategorySlug] as const,
  level3Display: (categoryId: string) => [...categoryKeys.all, 'level3-display', categoryId] as const,
  brands: (categoryId: string, subcategoryId?: string, subSubcategoryId?: string) =>
    [...categoryKeys.all, 'brands', categoryId, subcategoryId, subSubcategoryId] as const,
};

// Hook to fetch all categories
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const result = await fetchCategories();
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - categories rarely change
  });
}

// Hook to fetch a single category by ID or slug
export function useCategory(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(idOrSlug || ''),
    queryFn: async () => {
      if (!idOrSlug) return null;
      const result = await fetchCategoryByIdOrSlug(idOrSlug);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!idOrSlug,
    staleTime: 1000 * 60 * 30,
  });
}

// Hook to fetch subcategories for a category
export function useSubcategories(categoryId: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.subcategories(categoryId || ''),
    queryFn: async () => {
      if (!categoryId) return [];
      const result = await fetchSubcategories(categoryId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 30,
  });
}

// Hook to fetch sub-subcategories
export function useSubSubcategories(subcategoryId: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.subSubcategories(subcategoryId || ''),
    queryFn: async () => {
      if (!subcategoryId) return [];
      const result = await fetchSubSubcategories(subcategoryId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!subcategoryId,
    staleTime: 1000 * 60 * 10,
  });
}

// Hook to fetch Level 4 categories
export function useLevel4Categories(subSubcategoryId: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.level4(subSubcategoryId || ''),
    queryFn: async () => {
      if (!subSubcategoryId) return [];
      const result = await fetchSubSubSubcategories(subSubcategoryId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!subSubcategoryId,
    staleTime: 1000 * 60 * 10,
  });
}

// Hook to fetch full category hierarchy
export function useCategoryHierarchy(
  categorySlug: string | undefined,
  subcategorySlug?: string,
  subSubcategorySlug?: string
) {
  return useQuery({
    queryKey: categoryKeys.hierarchy(categorySlug || '', subcategorySlug, subSubcategorySlug),
    queryFn: async () => {
      if (!categorySlug) {
        return { level1: null, level2: null, level3: null, level4Items: [] };
      }
      const result = await fetchCategoryHierarchy(categorySlug, subcategorySlug, subSubcategorySlug);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!categorySlug,
    staleTime: 1000 * 60 * 10,
  });
}

// Hook to fetch Level 3 categories for category page display
export function useLevel3CategoriesForDisplay(categoryId: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.level3Display(categoryId || ''),
    queryFn: async () => {
      if (!categoryId) return [];
      const result = await fetchLevel3CategoriesForDisplay(categoryId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 10,
  });
}

// Hook to fetch brands for a category
export function useBrandsForCategory(
  categoryId: string | undefined,
  subcategoryId?: string,
  subSubcategoryId?: string
) {
  return useQuery({
    queryKey: categoryKeys.brands(categoryId || '', subcategoryId, subSubcategoryId),
    queryFn: async () => {
      if (!categoryId) return [];
      const result = await fetchBrandsForCategory(categoryId, subcategoryId, subSubcategoryId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5,
  });
}
