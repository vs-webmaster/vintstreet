import {
  fetchAllCategoriesWithSynonyms,
  fetchAllSubcategoriesWithSynonyms,
  fetchAllSubSubcategoriesWithSynonyms,
  fetchAllSubSubSubcategoriesWithSynonyms,
} from '@/services/categories';
import { searchProductsByName } from '@/services/products';
import { isFailure } from '@/types/api';

interface CategoryMatch {
  id: string;
  level: number;
  name: string;
  slug: string;
}

export async function findCategoriesBySynonyms(searchTerm: string): Promise<CategoryMatch[]> {
  const term = searchTerm.toLowerCase().trim();
  if (term.length < 2) return [];

  const matchedCategories: CategoryMatch[] = [];

  // Search all 4 levels in parallel + products
  const [level1Result, level2Result, level3Result, level4Result, productsResult] = await Promise.all([
    fetchAllCategoriesWithSynonyms(),
    fetchAllSubcategoriesWithSynonyms(),
    fetchAllSubSubcategoriesWithSynonyms(),
    fetchAllSubSubSubcategoriesWithSynonyms(),
    searchProductsByName(term, 10),
  ]);

  const level1 = isFailure(level1Result) ? { data: [] } : { data: level1Result.data };
  const level2 = isFailure(level2Result) ? { data: [] } : { data: level2Result.data };
  const level3 = isFailure(level3Result) ? { data: [] } : { data: level3Result.data };
  const level4 = isFailure(level4Result) ? { data: [] } : { data: level4Result.data };
  const products = isFailure(productsResult) ? { data: [] } : { data: productsResult.data };

  // Check level 1 categories
  level1.data?.forEach((cat) => {
    const matches =
      cat.name.toLowerCase().includes(term) ||
      cat.slug.toLowerCase().includes(term) ||
      cat.synonyms?.some((s: string) => s.toLowerCase().includes(term));

    if (matches) {
      matchedCategories.push({
        id: cat.id,
        level: 1,
        name: cat.name,
        slug: cat.slug,
      });
    }
  });

  // Check level 2 categories
  level2.data?.forEach((cat) => {
    const matches =
      cat.name.toLowerCase().includes(term) ||
      cat.slug.toLowerCase().includes(term) ||
      cat.synonyms?.some((s: string) => s.toLowerCase().includes(term));

    if (matches) {
      matchedCategories.push({
        id: cat.id,
        level: 2,
        name: cat.name,
        slug: cat.slug,
      });
    }
  });

  // Check level 3 categories
  level3.data?.forEach((cat) => {
    const matches =
      cat.name.toLowerCase().includes(term) ||
      cat.slug.toLowerCase().includes(term) ||
      cat.synonyms?.some((s: string) => s.toLowerCase().includes(term));

    if (matches) {
      matchedCategories.push({
        id: cat.id,
        level: 3,
        name: cat.name,
        slug: cat.slug,
      });
    }
  });

  // Check level 4 categories
  level4.data?.forEach((cat) => {
    const matches =
      cat.name.toLowerCase().includes(term) ||
      cat.slug.toLowerCase().includes(term) ||
      cat.synonyms?.some((s: string) => s.toLowerCase().includes(term));

    if (matches) {
      matchedCategories.push({
        id: cat.id,
        level: 4,
        name: cat.name,
        slug: cat.slug,
      });
    }
  });

  // Add products to results if they match the search term
  products.data?.forEach((product) => {
    matchedCategories.push({
      id: product.id,
      level: 5, // Use level 5 to indicate this is a product, not a category
      name: product.product_name,
      slug: product.slug || product.id,
    });
  });

  return matchedCategories;
}
