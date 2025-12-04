// Centralized Category Types
// All category hierarchy type definitions in one place

export interface CategoryBase {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  display_order?: number;
  image_url?: string | null;
  synonyms?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

// Level 1 Category
export interface Category extends CategoryBase {
  icon?: string | null;
  description?: string | null;
  disable_main_link?: boolean | null;
}

// Level 2 Subcategory
export interface Subcategory extends CategoryBase {
  category_id: string;
  show_in_category_grid?: boolean | null;
}

// Level 3 Sub-subcategory
export interface SubSubcategory extends CategoryBase {
  subcategory_id: string;
  show_in_category_grid?: boolean | null;
}

// Level 4 Sub-sub-subcategory
export interface SubSubSubcategory extends CategoryBase {
  sub_subcategory_id: string;
}

// Full category hierarchy (for breadcrumbs, navigation)
export interface CategoryHierarchy {
  level1: Category | null;
  level2: Subcategory | null;
  level3: SubSubcategory | null;
  level4?: SubSubSubcategory | null;
  level4Items?: SubSubSubcategory[];
}

// Category with children (for mega menu, nav)
export interface CategoryWithChildren extends Category {
  subcategories?: SubcategoryWithChildren[];
}

export interface SubcategoryWithChildren extends Subcategory {
  sub_subcategories?: SubSubcategoryWithChildren[];
}

export interface SubSubcategoryWithChildren extends SubSubcategory {
  sub_sub_subcategories?: SubSubSubcategory[];
}

// Category selection state (for product forms)
export interface CategorySelection {
  categoryId: string | null;
  subcategoryId: string | null;
  subSubcategoryId: string | null;
  subSubSubcategoryId: string | null;
}

// Type guards
export const isCategory = (obj: unknown): obj is Category => {
  if (!obj || typeof obj !== 'object') return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.slug === 'string'
  );
};

export const getCategoryLevel = (category: CategoryBase & { category_id?: string; subcategory_id?: string; sub_subcategory_id?: string }): 1 | 2 | 3 | 4 => {
  if ('sub_subcategory_id' in category && category.sub_subcategory_id) return 4;
  if ('subcategory_id' in category && category.subcategory_id) return 3;
  if ('category_id' in category && category.category_id) return 2;
  return 1;
};

// Build URL path from category hierarchy
export const buildCategoryPath = (hierarchy: CategoryHierarchy): string => {
  const parts: string[] = ['/shop'];
  if (hierarchy.level1?.slug) parts.push(hierarchy.level1.slug);
  if (hierarchy.level2?.slug) parts.push(hierarchy.level2.slug);
  if (hierarchy.level3?.slug) parts.push(hierarchy.level3.slug);
  if (hierarchy.level4?.slug) parts.push(hierarchy.level4.slug);
  return parts.join('/');
};

// Build breadcrumb items from category hierarchy
export interface BreadcrumbItem {
  label: string;
  href: string;
}

export const buildCategoryBreadcrumbs = (hierarchy: CategoryHierarchy): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [{ label: 'Shop', href: '/shop' }];
  
  if (hierarchy.level1) {
    items.push({
      label: hierarchy.level1.name,
      href: `/shop/${hierarchy.level1.slug}`,
    });
  }
  if (hierarchy.level2) {
    items.push({
      label: hierarchy.level2.name,
      href: `/shop/${hierarchy.level1?.slug}/${hierarchy.level2.slug}`,
    });
  }
  if (hierarchy.level3) {
    items.push({
      label: hierarchy.level3.name,
      href: `/shop/${hierarchy.level1?.slug}/${hierarchy.level2?.slug}/${hierarchy.level3.slug}`,
    });
  }
  if (hierarchy.level4) {
    items.push({
      label: hierarchy.level4.name,
      href: `/shop/${hierarchy.level1?.slug}/${hierarchy.level2?.slug}/${hierarchy.level3?.slug}/${hierarchy.level4.slug}`,
    });
  }
  
  return items;
};
