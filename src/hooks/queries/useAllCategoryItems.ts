import { useQuery } from '@tanstack/react-query';
import { fetchAllSubcategories, fetchAllSubSubcategories, fetchAllSubSubSubcategories } from '@/services/categories';
import { isFailure } from '@/types/api';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  level: number;
  category_id: string | null;
}

export const categoryItemsKeys = {
  all: ['all-category-items'] as const,
};

async function fetchAllCategoryItems(): Promise<CategoryItem[]> {
  const [level2Result, level3Result, level4Result] = await Promise.all([
    fetchAllSubcategories(),
    fetchAllSubSubcategories(),
    fetchAllSubSubSubcategories(),
  ]);

  if (isFailure(level2Result)) throw level2Result.error;
  if (isFailure(level3Result)) throw level3Result.error;
  if (isFailure(level4Result)) throw level4Result.error;

  const level2Data = level2Result.data;
  const level3Data = level3Result.data;
  const level4Data = level4Result.data;

  // Build maps for relationships
  const level2Map = new Map(level2Data.map((l2) => [l2.id, l2.category_id]));
  const level3Map = new Map(level3Data.map((l3) => [l3.id, l3.subcategory_id]));

  // Create unified list with level indicators
  const items: CategoryItem[] = [
    ...level2Data.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      level: 2,
      category_id: item.category_id,
    })),
    ...level3Data.map((item) => {
      const level2Id = level3Map.get(item.id);
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        level: 3,
        category_id: level2Id ? (level2Map.get(level2Id) ?? null) : null,
      };
    }),
    ...level4Data.map((item) => {
      const level3Id = item.sub_subcategory_id;
      const level2Id = level3Id ? level3Map.get(level3Id) : null;
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        level: 4,
        category_id: level2Id ? (level2Map.get(level2Id) ?? null) : null,
      };
    }),
  ];

  return items;
}

export function useAllCategoryItems() {
  return useQuery({
    queryKey: categoryItemsKeys.all,
    queryFn: fetchAllCategoryItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
