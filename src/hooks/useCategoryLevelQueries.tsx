import { useQuery } from '@tanstack/react-query';
import { fetchCategoryList, fetchSubcategoryList } from '@/services/categories';
import { isFailure } from '@/types/api';

interface CategoryItem {
  id: string;
  name: string;
}

/**
 * Hook for fetching Level 1 categories
 */
export function useLevel1Categories() {
  return useQuery<CategoryItem[]>({
    queryKey: ['level1-categories'],
    queryFn: async () => {
      const result = await fetchCategoryList();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook for fetching Level 2 categories, optionally filtered by Level 1
 */
export function useLevel2Categories(filterLevel1: string = 'all') {
  return useQuery<CategoryItem[]>({
    queryKey: ['level2-categories', filterLevel1],
    queryFn: async () => {
      const categoryId = filterLevel1 !== 'all' ? filterLevel1 : undefined;
      const result = await fetchSubcategoryList(categoryId);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 300000, // 5 minutes
  });
}
