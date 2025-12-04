import type { CategoryItem } from '@/hooks/queries/useAllCategoryItems';

export interface MegaMenuItem {
  category_id: string;
  item_level: number;
  subcategory_id?: string;
  sub_subcategory_id?: string;
  sub_sub_subcategory_id?: string;
  product_subcategories?: { name: string; slug: string };
  product_sub_subcategories?: { name: string; slug: string };
  product_sub_sub_subcategories?: { name: string; slug: string };
}

export interface InsertData {
  category_id: string;
  item_level: number;
  is_active: boolean;
  subcategory_id?: string;
  sub_subcategory_id?: string;
  sub_sub_subcategory_id?: string;
}

export interface AvailableItemsByLevel {
  2: CategoryItem[];
  3: CategoryItem[];
  4: CategoryItem[];
}

/**
 * Builds insert data from item data string (format: "level:id")
 */
export function buildInsertDataFromItemData(categoryId: string, itemData: string): InsertData {
  const [level, itemId] = itemData.split(':');
  const itemLevel = parseInt(level);

  const insertData: InsertData = {
    category_id: categoryId,
    item_level: itemLevel,
    is_active: true,
  };

  if (itemLevel === 2) {
    insertData.subcategory_id = itemId;
  } else if (itemLevel === 3) {
    insertData.sub_subcategory_id = itemId;
  } else if (itemLevel === 4) {
    insertData.sub_sub_subcategory_id = itemId;
  }

  return insertData;
}

/**
 * Extracts selected item keys from a list of mega menu items
 */
export function getSelectedItemKeys(items: MegaMenuItem[], categoryId: string): string[] {
  return items
    .filter((item) => item.category_id === categoryId)
    .map((item) => {
      const level = item.item_level;
      const id =
        level === 2
          ? item.subcategory_id
          : level === 3
            ? item.sub_subcategory_id
            : item.sub_sub_subcategory_id;
      return `${level}:${id}`;
    });
}

/**
 * Groups available items by level, excluding already selected items
 */
export function getAvailableItemsByLevel(
  allCategoryItems: CategoryItem[],
  categoryId: string,
  selectedItemKeys: string[]
): { availableItemsByLevel: AvailableItemsByLevel; hasAvailableItems: boolean } {
  const categoryItems = allCategoryItems.filter((item) => item.category_id === categoryId);

  const availableItemsByLevel: AvailableItemsByLevel = {
    2: categoryItems.filter((item) => item.level === 2 && !selectedItemKeys.includes(`2:${item.id}`)),
    3: categoryItems.filter((item) => item.level === 3 && !selectedItemKeys.includes(`3:${item.id}`)),
    4: categoryItems.filter((item) => item.level === 4 && !selectedItemKeys.includes(`4:${item.id}`)),
  };

  const hasAvailableItems = Object.values(availableItemsByLevel).some((arr) => arr.length > 0);

  return { availableItemsByLevel, hasAvailableItems };
}

/**
 * Gets the display name from a mega menu item based on its level
 */
export function getItemDisplayName(item: MegaMenuItem): string {
  const level = item.item_level;
  return level === 2
    ? item.product_subcategories?.name ?? ''
    : level === 3
      ? item.product_sub_subcategories?.name ?? ''
      : item.product_sub_sub_subcategories?.name ?? '';
}

/**
 * Gets the level label (L2, L3, L4) from item level
 */
export function getLevelLabel(level: number): string {
  return level === 2 ? 'L2' : level === 3 ? 'L3' : 'L4';
}
