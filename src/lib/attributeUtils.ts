// Attribute utility functions

import { fetchAttributesByCategoryLevels as fetchAttributesByCategoryLevelsService } from '@/services/attributes';
import { isFailure } from '@/types/api';

export interface AttributeOption {
  id: string;
  value: string;
  is_active?: boolean;
}

export interface AttributeAnalysis {
  options: AttributeOption[];
  hasOptions: boolean;
  isCustomValue: boolean;
}

export interface CategoryAttribute {
  id: string;
  name: string;
  data_type: string;
  display_order: number | null;
}

export const analyzeAttribute = (
  attr: { attribute_options?: AttributeOption[] },
  currentValue: unknown,
): AttributeAnalysis => {
  const options = attr.attribute_options || [];
  const hasOptions = options.length > 0;

  const isCustomValue =
    hasOptions && !!currentValue && !options.filter((opt) => opt.is_active).some((opt) => opt.value === currentValue);

  return { options, hasOptions, isCustomValue };
};

/**
 * Fetch attributes linked to category levels (L2 and L3) and return unique, sorted attributes.
 */
export const fetchAttributesByCategoryLevels = async (
  subcategoryIds: string[],
  subSubcategoryIds: string[],
): Promise<CategoryAttribute[]> => {
  const allAttributes: CategoryAttribute[] = [];
  const seenIds = new Set<string>();

  // Fetch attributes for each subcategory (L2)
  for (const subcategoryId of subcategoryIds) {
    const result = await fetchAttributesByCategoryLevelsService(undefined, subcategoryId, undefined);

    if (isFailure(result)) {
      throw result.error;
    }

    for (const attr of result.data) {
      // Only include attributes with a name and that we haven't seen before
      if (attr.name && !seenIds.has(attr.id)) {
        seenIds.add(attr.id);
        allAttributes.push({
          id: attr.id,
          name: attr.name,
          data_type: attr.data_type || 'text',
          display_order: attr.display_order ?? null,
        });
      }
    }
  }

  // Fetch attributes for each sub-subcategory (L3) - these take priority
  for (const subSubcategoryId of subSubcategoryIds) {
    const result = await fetchAttributesByCategoryLevelsService(undefined, undefined, subSubcategoryId);

    if (isFailure(result)) {
      throw result.error;
    }

    for (const attr of result.data) {
      // Only include attributes with a name
      if (attr.name) {
        if (!seenIds.has(attr.id)) {
          seenIds.add(attr.id);
          allAttributes.push({
            id: attr.id,
            name: attr.name,
            data_type: attr.data_type || 'text',
            display_order: attr.display_order ?? null,
          });
        } else {
          // Update existing attribute (L3 takes priority)
          const existingIndex = allAttributes.findIndex((a) => a.id === attr.id);
          if (existingIndex !== -1) {
            allAttributes[existingIndex] = {
              id: attr.id,
              name: attr.name,
              data_type: attr.data_type || 'text',
              display_order: attr.display_order ?? null,
            };
          }
        }
      }
    }
  }

  // Sort by display_order (nulls last), then by name
  return allAttributes.sort((a, b) => {
    if (a.display_order === null && b.display_order === null) {
      return a.name.localeCompare(b.name);
    }
    if (a.display_order === null) return 1;
    if (b.display_order === null) return -1;
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return a.name.localeCompare(b.name);
  });
};
