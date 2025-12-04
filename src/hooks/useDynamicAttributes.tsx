import { useQuery } from '@tanstack/react-query';
import {
  fetchAttributesByCategoryLevels,
  saveProductAttributeValues,
  type AttributeValueInsert,
} from '@/services/attributes';
import { isFailure } from '@/types/api';

// Measurement attributes that should sort to the bottom
const MEASUREMENT_ATTRS = ['measurements', 'pit to pit cm', 'pit-to-pit-cm', 'collar to hem', 'collar-to-hem'] as const;

interface AttributeOption {
  id: string;
  value: string;
  is_active: boolean | null;
  display_order: number;
}

interface Attribute {
  id: string;
  name?: string;
  display_order?: number | null;
  data_type?: string;
  attribute_options?: AttributeOption[];
  [key: string]: unknown;
}

/**
 * Sorts attributes with measurement-related ones at the bottom.
 * Uses single-pass normalization for efficiency.
 */
function sortAttributesMeasurementsLast(attrs: Attribute[]): Attribute[] {
  // Pre-compute normalized names and measurement flags
  const enriched = attrs.map((attr) => {
    const normalizedName = (attr.name ?? '').toLowerCase().replace(/[_-]/g, ' ');
    return {
      attr,
      isMeasurement: MEASUREMENT_ATTRS.some((m) => normalizedName.includes(m)),
    };
  });

  // Sort by measurement flag, then by display_order
  enriched.sort((a, b) => {
    if (a.isMeasurement !== b.isMeasurement) {
      return a.isMeasurement ? 1 : -1;
    }
    return (a.attr.display_order ?? 0) - (b.attr.display_order ?? 0);
  });

  // Return just the attributes
  return enriched.map((e) => e.attr);
}

export const useDynamicAttributes = (categoryId?: string, subcategoryId?: string, subSubcategoryId?: string) => {
  const { data: attributes = [], isLoading } = useQuery({
    queryKey: ['category-attributes', categoryId, subcategoryId, subSubcategoryId],
    queryFn: async () => {
      const result = await fetchAttributesByCategoryLevels(categoryId, subcategoryId, subSubcategoryId);
      if (isFailure(result)) {
        throw result.error;
      }
      return sortAttributesMeasurementsLast(result.data);
    },
    enabled: !!categoryId || !!subcategoryId || !!subSubcategoryId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since attributes rarely change
  });

  const saveAttributeValues = async (productId: string, dynamicAttributes: Record<string, unknown>) => {
    if (Object.keys(dynamicAttributes).length === 0) {
      return;
    }

    // Build the list of attribute values to upsert
    const attributeValues: AttributeValueInsert[] = Object.entries(dynamicAttributes)
      .filter(([_, value]) => {
        if (value === '' || value === null || value === undefined) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
      .map(([attributeId, value]) => {
        const attribute = attributes.find((a) => a.id === attributeId);
        if (!attribute) return null;

        const valueObj: AttributeValueInsert = {
          product_id: productId,
          attribute_id: attributeId,
          value_text: null,
          value_number: null,
          value_boolean: null,
          value_date: null,
        };

        switch (attribute.data_type) {
          case 'multi-select':
            valueObj.value_text = Array.isArray(value) ? JSON.stringify(value) : String(value);
            break;
          case 'string':
          case 'textarea':
            valueObj.value_text = String(value);
            break;
          case 'number':
            valueObj.value_number = parseFloat(String(value));
            break;
          case 'boolean':
            valueObj.value_boolean = Boolean(value);
            break;
          case 'date':
            valueObj.value_date = String(value);
            break;
        }

        return valueObj;
      })
      .filter((v): v is AttributeValueInsert => v !== null);

    if (attributeValues.length === 0) {
      return;
    }

    try {
      const result = await saveProductAttributeValues(productId, attributeValues);
      if (isFailure(result)) {
        console.error('[SAFE] Error saving attribute values:', result.error);
        throw result.error;
      }
    } catch (error) {
      console.error('[SAFE] Error in saveAttributeValues:', error);
      throw error;
    }
  };

  return { attributes, isLoading, saveAttributeValues };
};
