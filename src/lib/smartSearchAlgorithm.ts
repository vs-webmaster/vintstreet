import { fetchAttributeValuesForProducts } from '@/services/attributes';
import { fetchCategories } from '@/services/categories';
import { fetchProductIdsWithCategoryInfo, fetchRelatedBrandsForCategory } from '@/services/products';
import { isFailure } from '@/types/api';

interface SmartSuggestion {
  type: 'smart_suggestion';
  displayText: string;
  brandId?: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  categoryUrl?: string;
  categoryLevel?: number;
  attributeFilters?: Array<{ attributeId: string; attributeName: string; value: string }>;
  score: number; // Higher score = more relevant
}

interface DetectedEntity {
  brand?: { id: string; name: string };
  category?: { id: string; name: string; slug: string; url: string; level: number };
}

// Public API
export async function generateSmartSuggestions(
  searchQuery: string,
  allBrands: Array<{ id: string; name: string }>,
  allCategories: Array<{
    id: string;
    name: string;
    slug: string;
    url: string;
    level: number;
    synonyms?: string[];
  }>,
): Promise<SmartSuggestion[]> {
  const q = searchQuery.trim();
  if (q.length < 3) return [];

  const suggestions: SmartSuggestion[] = [];

  // 1) Detect brand/category from query (prefer deepest category)
  const detected = detectBrandAndCategory(q, allBrands, allCategories);

  // 2) Find matching products for context (brand + category or just category)
  const matchingProducts = await findMatchingProducts(
    detected.brand?.id,
    detected.category?.id,
    detected.category?.level,
  );

  // 3) If nothing detected, stop
  if (!detected.brand && !detected.category) return suggestions;

  // 4) If no products, still show a clean suggestion (no breadcrumbs)
  if (matchingProducts.length === 0) {
    if (detected.category) {
      suggestions.push(baseCategorySuggestion(detected.category, 5));
    }
    if (detected.brand && detected.category) {
      suggestions.push({
        type: 'smart_suggestion',
        displayText: `${detected.brand.name} ${detected.category.name}`,
        brandId: detected.brand.id,
        brandName: detected.brand.name,
        categoryId: detected.category.id,
        categoryName: detected.category.name,
        categorySlug: detected.category.slug,
        categoryUrl: detected.category.url,
        categoryLevel: detected.category.level,
        score: 6,
      });
    }
    return dedupeAndSort(suggestions);
  }

  // 5) Mine attributes and top-level (Men's/Women's/Junior) context
  const [attributeCombos, topLevels] = await Promise.all([
    extractAttributeCombinations(matchingProducts),
    getTopLevelNamesFromProducts(matchingProducts),
  ]);

  // 6) Brand + Category + Attributes
  if (detected.brand && detected.category) {
    for (const combo of attributeCombos.slice(0, 4)) {
      const attrs = combo.attributes.map((a) => a.valueLabel).join(' ');
      suggestions.push({
        type: 'smart_suggestion',
        displayText: `${attrs} ${detected.brand.name} ${detected.category.name}`.trim(),
        brandId: detected.brand.id,
        brandName: detected.brand.name,
        categoryId: detected.category.id,
        categoryName: detected.category.name,
        categorySlug: detected.category.slug,
        categoryUrl: detected.category.url,
        categoryLevel: detected.category.level,
        attributeFilters: combo.attributes.map((a) => ({
          attributeId: a.attributeId,
          attributeName: a.attributeName,
          value: a.value,
        })),
        score: 12 + combo.productCount,
      });
    }
    suggestions.push({
      type: 'smart_suggestion',
      displayText: `${detected.brand.name} ${detected.category.name}`,
      brandId: detected.brand.id,
      brandName: detected.brand.name,
      categoryId: detected.category.id,
      categoryName: detected.category.name,
      categorySlug: detected.category.slug,
      categoryUrl: detected.category.url,
      categoryLevel: detected.category.level,
      score: 9,
    });
  }

  // 7) Category-only suggestions: "Light Wash Jeans" and "Men's Light Wash Jeans"
  if (!detected.brand && detected.category) {
    for (const combo of attributeCombos.slice(0, 4)) {
      const attrs = combo.attributes.map((a) => a.valueLabel).join(' ');
      // Without prefix
      suggestions.push({
        type: 'smart_suggestion',
        displayText: `${attrs} ${detected.category.name}`.trim(),
        categoryId: detected.category.id,
        categoryName: detected.category.name,
        categorySlug: detected.category.slug,
        categoryUrl: detected.category.url,
        categoryLevel: detected.category.level,
        attributeFilters: combo.attributes.map((a) => ({
          attributeId: a.attributeId,
          attributeName: a.attributeName,
          value: a.value,
        })),
        score: 10 + combo.productCount,
      });
      // With Men's/Women's/Junior prefix
      for (const tl of topLevels.slice(0, 2)) {
        suggestions.push({
          type: 'smart_suggestion',
          displayText: `${tl.name} ${attrs} ${detected.category.name}`.trim(),
          categoryId: detected.category.id,
          categoryName: detected.category.name,
          categorySlug: detected.category.slug,
          categoryUrl: detected.category.url,
          categoryLevel: detected.category.level,
          attributeFilters: combo.attributes.map((a) => ({
            attributeId: a.attributeId,
            attributeName: a.attributeName,
            value: a.value,
          })),
          score: 11 + combo.productCount + tl.count,
        });
      }
    }
    // Generic top-level + category (Men's Jeans)
    for (const tl of topLevels.slice(0, 3)) {
      suggestions.push({
        type: 'smart_suggestion',
        displayText: `${tl.name} ${detected.category.name}`,
        categoryId: detected.category.id,
        categoryName: detected.category.name,
        categorySlug: detected.category.slug,
        categoryUrl: detected.category.url,
        categoryLevel: detected.category.level,
        score: 8 + tl.count,
      });
    }
  }

  // 8) Related brands for variety
  if (detected.category) {
    const related = await findRelatedBrands(detected.brand?.id, detected.category.id, detected.category.level);
    for (const b of related.slice(0, 2)) {
      suggestions.push({
        type: 'smart_suggestion',
        displayText: `${b.name} ${detected.category.name}`,
        brandId: b.id,
        brandName: b.name,
        categoryId: detected.category.id,
        categoryName: detected.category.name,
        categorySlug: detected.category.slug,
        categoryUrl: detected.category.url,
        categoryLevel: detected.category.level,
        score: 6,
      });
    }
  }

  return dedupeAndSort(suggestions).slice(0, 8);
}

function baseCategorySuggestion(
  category: { id: string; name: string; slug: string; url: string; level: number },
  score = 5,
): SmartSuggestion {
  return {
    type: 'smart_suggestion',
    displayText: `${category.name}`,
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    categoryUrl: category.url,
    categoryLevel: category.level,
    score,
  };
}

function detectBrandAndCategory(
  query: string,
  brands: Array<{ id: string; name: string }>,
  categories: Array<{ id: string; name: string; slug: string; url: string; level: number; synonyms?: string[] }>,
): DetectedEntity {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const qLower = query.toLowerCase();

  const brand = brands.find((b) => {
    const bn = b.name.toLowerCase();
    return terms.includes(bn) || qLower.includes(bn);
  });

  const matchedCats = categories
    .filter((c) => {
      const cn = c.name.toLowerCase();
      if (terms.some((t) => cn.includes(t) || t.includes(cn))) return true;
      if (c.synonyms && c.synonyms.length) {
        if (
          c.synonyms.some((s) => {
            const sl = s.toLowerCase();
            return terms.some((t) => sl.includes(t) || t.includes(sl));
          })
        )
          return true;
      }
      return false;
    })
    .sort((a, b) => b.level - a.level);

  return { brand, category: matchedCats[0] };
}

async function findMatchingProducts(
  brandId?: string,
  categoryId?: string,
  categoryLevel?: number,
): Promise<
  Array<{
    id: string;
    category_id?: string;
    subcategory_id?: string;
    sub_subcategory_id?: string;
    sub_sub_subcategory_id?: string;
  }>
> {
  if (!brandId && !categoryId) return [];

  const result = await fetchProductIdsWithCategoryInfo({
    brandId,
    categoryId,
    categoryLevel,
    limit: 150,
  });

  if (isFailure(result)) {
    console.error('Error finding matching products:', result.error);
    return [];
  }

  return result.data;
}

async function extractAttributeCombinations(products: Array<{ id: string }>): Promise<
  Array<{
    attributes: Array<{ attributeId: string; attributeName: string; valueLabel: string; value: string }>;
    productCount: number;
  }>
> {
  if (!products.length) return [];
  const productIds = products.map((p) => p.id);

  const result = await fetchAttributeValuesForProducts(productIds, 50000);

  if (isFailure(result) || !result.data) {
    return [];
  }

  const data = result.data;

  const productAttrMap = new Map<
    string,
    Array<{ attributeId: string; attributeName: string; value: string; valueLabel: string }>
  >();

  for (const row of data as any[]) {
    const attr = row.attributes;
    const value = row.value_text ?? String(row.value_number ?? row.value_boolean ?? '');
    const valueLabel = value;
    if (!productAttrMap.has(row.product_id)) productAttrMap.set(row.product_id, []);
    productAttrMap.get(row.product_id)!.push({
      attributeId: attr.id,
      attributeName: attr.display_label || attr.name,
      value,
      valueLabel,
    });
  }

  const comboMap = new Map<
    string,
    {
      attributes: Array<{ attributeId: string; attributeName: string; valueLabel: string; value: string }>;
      productIds: Set<string>;
    }
  >();
  for (const [pid, attrs] of productAttrMap.entries()) {
    for (const a of attrs) {
      const key = `${a.attributeId}:${a.value}`;
      if (!comboMap.has(key)) comboMap.set(key, { attributes: [a], productIds: new Set() });
      comboMap.get(key)!.productIds.add(pid);
    }
  }

  return Array.from(comboMap.values())
    .map((v) => ({ attributes: v.attributes, productCount: v.productIds.size }))
    .filter((c) => c.productCount >= 2)
    .sort((a, b) => b.productCount - a.productCount);
}

async function getTopLevelNamesFromProducts(
  products: Array<{ category_id?: string }>,
): Promise<Array<{ id: string; name: string; count: number }>> {
  const ids = products.map((p) => p.category_id).filter(Boolean) as string[];
  if (!ids.length) return [];
  const unique = Array.from(new Set(ids));

  const result = await fetchCategories();
  if (isFailure(result) || !result.data) return [];

  const categories = result.data.filter((cat) => unique.includes(cat.id));
  const countMap = new Map<string, { name: string; count: number }>();
  for (const id of ids) {
    const cat = categories.find((d) => d.id === id);
    if (!cat) continue;
    if (!countMap.has(id)) countMap.set(id, { name: cat.name, count: 0 });
    countMap.get(id)!.count++;
  }
  return Array.from(countMap.entries())
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

async function findRelatedBrands(
  excludeBrandId: string | undefined,
  categoryId: string,
  categoryLevel: number,
): Promise<Array<{ id: string; name: string; productCount: number }>> {
  const result = await fetchRelatedBrandsForCategory(excludeBrandId, categoryId, categoryLevel);

  if (isFailure(result)) {
    return [];
  }

  return result.data;
}

function removeDuplicates(suggestions: SmartSuggestion[]): SmartSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    const key = s.displayText.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeAndSort(s: SmartSuggestion[]): SmartSuggestion[] {
  return removeDuplicates(s).sort((a, b) => b.score - a.score);
}
