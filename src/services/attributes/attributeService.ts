// Attribute Service
// Centralized data access for product attributes

import { supabase } from '@/integrations/supabase/client';
import { normalizeError, logError } from '@/lib/errors';
import type { Result } from '@/types/api';
import { success, failure } from '@/types/api';

export interface ProductAttributeValue {
  id: string;
  product_id: string;
  attribute_id: string;
  value_text?: string | null;
  value_number?: number | null;
  value_boolean?: boolean | null;
  value_date?: string | null;
  attributes?: {
    id: string;
    name: string;
    data_type: string;
  };
}

// Fetch product attributes by product ID
export async function fetchProductAttributes(productId: string): Promise<Result<ProductAttributeValue[]>> {
  try {
    const { data, error } = await supabase
      .from('product_attribute_values')
      .select(`*, attributes (id, name, data_type)`)
      .eq('product_id', productId);

    if (error) throw error;

    return success((data || []) as unknown as ProductAttributeValue[]);
  } catch (error) {
    logError(error, 'attributeService:fetchProductAttributes');
    return failure(normalizeError(error));
  }
}

// Fetch product attribute by attribute name (e.g., color)
export async function fetchProductAttributeByName(
  productId: string,
  attributeName: string,
): Promise<Result<ProductAttributeValue | null>> {
  try {
    const { data, error } = await supabase
      .from('product_attribute_values')
      .select('value_text, attributes!inner(name)')
      .eq('product_id', productId)
      .ilike('attributes.name', `%${attributeName}%`)
      .maybeSingle();

    if (error) throw error;

    return success((data || null) as unknown as ProductAttributeValue | null);
  } catch (error) {
    logError(error, 'attributeService:fetchProductAttributeByName');
    return failure(normalizeError(error));
  }
}

// Fetch product IDs by attribute value
export async function fetchProductIdsByAttributeValue(
  attributeName: string,
  attributeValue: string,
  categoryId: string,
  subcategoryId: string,
  subSubcategoryId: string,
  excludeProductId?: string,
): Promise<Result<string[]>> {
  try {
    let query = supabase
      .from('product_attribute_values')
      .select('product_id, attributes!inner(name), listings!inner(category_id, subcategory_id, sub_subcategory_id)')
      .ilike('attributes.name', `%${attributeName}%`)
      .eq('value_text', attributeValue)
      .eq('listings.category_id', categoryId)
      .eq('listings.subcategory_id', subcategoryId)
      .eq('listings.sub_subcategory_id', subSubcategoryId);

    if (excludeProductId) {
      query = query.neq('product_id', excludeProductId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const productIds = (data || []).map((item) => item.product_id).filter((id): id is string => !!id);
    return success(productIds);
  } catch (error) {
    logError(error, 'attributeService:fetchProductIdsByAttributeValue');
    return failure(normalizeError(error));
  }
}

// Fetch attribute values for multiple products (for smart search)
export async function fetchAttributeValuesForProducts(
  productIds: string[],
  limit: number = 50000,
): Promise<
  Result<
    Array<{
      id: string;
      product_id: string;
      attribute_id: string;
      value_text?: string | null;
      value_number?: number | null;
      value_boolean?: boolean | null;
      attributes: {
        id: string;
        name: string;
        display_label?: string | null;
        data_type: string;
      };
    }>
  >
> {
  try {
    if (productIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('product_attribute_values')
      .select(
        `
        id,
        product_id,
        attribute_id,
        value_text,
        value_number,
        value_boolean,
        attributes!inner(
          id,
          name,
          display_label,
          data_type
        )
      `,
      )
      .in('product_id', productIds)
      .limit(limit);

    if (error) throw error;

    return success(
      (data || []) as Array<{
        id: string;
        product_id: string;
        attribute_id: string;
        value_text?: string | null;
        value_number?: number | null;
        value_boolean?: boolean | null;
        attributes: {
          id: string;
          name: string;
          display_label?: string | null;
          data_type: string;
        };
      }>,
    );
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeValuesForProducts');
    return failure(normalizeError(error));
  }
}

export interface Attribute {
  id: string;
  name?: string;
  display_order?: number | null;
  data_type?: string;
  attribute_options?: Array<{
    id: string;
    value: string;
    is_active: boolean | null;
    display_order: number;
  }>;
  [key: string]: unknown;
}

// Fetch attributes by IDs
export async function fetchAttributesByIds(attributeIds: string[]): Promise<Result<Attribute[]>> {
  try {
    if (attributeIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('attributes')
      .select('*, attribute_options (id, value, is_active, display_order)')
      .in('id', attributeIds)
      .order('display_order');

    if (error) throw error;

    return success((data || []) as Attribute[]);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributesByIds');
    return failure(normalizeError(error));
  }
}

export interface AttributeCategoryLink {
  attribute_id: string;
  attributes: Attribute | null;
}

// Fetch attributes by category level (prioritizes level 3, then 2, then 1)
export async function fetchAttributesByCategoryLevels(
  categoryId?: string,
  subcategoryId?: string,
  subSubcategoryId?: string,
): Promise<Result<Attribute[]>> {
  try {
    // Prioritize level 3 (sub-subcategory) attributes if available
    if (subSubcategoryId) {
      const { data: level3Data, error: level3Error } = await supabase
        .from('attribute_sub_subcategories')
        .select(
          `
          attribute_id,
          attributes (
            *,
            attribute_options (
              id,
              value,
              is_active,
              display_order
            )
          )
        `,
        )
        .eq('sub_subcategory_id', subSubcategoryId);

      if (level3Error) throw level3Error;

      if (level3Data?.length) {
        const attributes = level3Data
          .map((item) => item.attributes)
          .filter((attr): attr is Attribute => Boolean(attr));
        return success(attributes);
      }
    }

    // Fall back to level 2 (subcategory) attributes if no level 3 attributes found
    if (subcategoryId) {
      const { data, error } = await supabase
        .from('attribute_subcategories')
        .select(
          `
          attribute_id,
          attributes (
            *,
            attribute_options (
              id,
              value,
              is_active,
              display_order
            )
          )
        `,
        )
        .eq('subcategory_id', subcategoryId);

      if (error) throw error;

      if (data?.length) {
        const attributes = data
          .map((item) => item.attributes)
          .filter((attr): attr is Attribute => Boolean(attr));
        return success(attributes);
      }
    }

    // Fall back to level 1 (category) attributes if no level 2 or 3 attributes found
    if (categoryId) {
      const { data, error } = await supabase
        .from('attribute_categories')
        .select(
          `
          attribute_id,
          attributes (
            *,
            attribute_options (
              id,
              value,
              is_active,
              display_order
            )
          )
        `,
        )
        .eq('category_id', categoryId);

      if (error) throw error;

      const attributes = (data || [])
        .map((item) => item.attributes)
        .filter((attr): attr is Attribute => Boolean(attr));
      return success(attributes);
    }

    return success([]);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributesByCategoryLevels');
    return failure(normalizeError(error));
  }
}

export interface AttributeValueInsert {
  product_id: string;
  attribute_id: string;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_date: string | null;
}

// Save product attribute values (deletes old values for specified attributes, then inserts new ones)
export async function saveProductAttributeValues(
  productId: string,
  attributeValues: AttributeValueInsert[],
): Promise<Result<boolean>> {
  try {
    if (attributeValues.length === 0) {
      return success(true);
    }

    const attributeIdsToUpdate = attributeValues.map((v) => v.attribute_id);

    // Delete old attribute values for these attributes
    const { error: deleteError } = await supabase
      .from('product_attribute_values')
      .delete()
      .eq('product_id', productId)
      .in('attribute_id', attributeIdsToUpdate);

    if (deleteError) throw deleteError;

    // Insert new attribute values
    const { error: insertError } = await supabase.from('product_attribute_values').insert(attributeValues);

    if (insertError) throw insertError;

    return success(true);
  } catch (error) {
    logError(error, 'attributeService:saveProductAttributeValues');
    return failure(normalizeError(error));
  }
}

export interface CategoryAttributeFilterWithRelations {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  sub_subcategory_id: string | null;
  sub_sub_subcategory_id: string | null;
  attribute_id: string | null;
  filter_name?: string | null;
  filter_type?: string | null;
  is_active: boolean;
  show_in_top_line?: boolean | null;
  display_order?: number | null;
  attributes?: {
    id: string;
    name: string;
    display_label?: string | null;
  } | null;
}

// Fetch category attribute filters with hierarchy support
export async function fetchCategoryAttributeFilters(params: {
  categoryId: string;
  subcategoryId?: string | null;
  subSubcategoryId?: string | null;
  filterType?: 'default' | 'attribute';
  isSubSubcategoryPage?: boolean;
}): Promise<Result<CategoryAttributeFilterWithRelations[]>> {
  try {
    const { categoryId, subcategoryId, subSubcategoryId, filterType, isSubSubcategoryPage } = params;

    let query;
    if (filterType === 'attribute') {
      query = supabase
        .from('category_attribute_filters')
        .select('*, attributes(id, name, display_label)')
        .eq('is_active', true)
        .eq('category_id', categoryId)
        .eq('filter_type', filterType);
    } else {
      query = supabase
        .from('category_attribute_filters')
        .select('*')
        .eq('is_active', true)
        .eq('category_id', categoryId);
      if (filterType) {
        query = query.eq('filter_type', filterType);
      }
    }

    // Apply hierarchy filters
    if (subcategoryId && !subSubcategoryId) {
      query = query.or(`subcategory_id.eq.${subcategoryId},subcategory_id.is.null`);
      query = query.is('sub_subcategory_id', null);
    } else if (subSubcategoryId && isSubSubcategoryPage) {
      query = query.or(
        `sub_subcategory_id.eq.${subSubcategoryId},and(subcategory_id.eq.${subcategoryId},sub_subcategory_id.is.null),subcategory_id.is.null`,
      );
    } else if (!subcategoryId) {
      query = query.is('subcategory_id', null).is('sub_subcategory_id', null);
    }

    const { data, error } = await query.order('display_order');

    if (error) throw error;
    return success((data || []) as CategoryAttributeFilterWithRelations[]);
  } catch (error) {
    logError(error, 'attributeService:fetchCategoryAttributeFilters');
    return failure(normalizeError(error));
  }
}

// Check if an attribute has active options
export async function checkAttributeHasOptions(attributeId: string): Promise<Result<boolean>> {
  try {
    const { data, error } = await supabase
      .from('attribute_options')
      .select('id')
      .eq('attribute_id', attributeId)
      .eq('is_active', true)
      .limit(1);

    if (error) throw error;
    return success((data?.length || 0) > 0);
  } catch (error) {
    logError(error, 'attributeService:checkAttributeHasOptions');
    return failure(normalizeError(error));
  }
}

// Fetch attribute filter values with listing filters
export async function fetchAttributeFilterValues(params: {
  attributeId: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  subSubcategoryId?: string | null;
  subSubSubcategoryIds?: string[];
  brandIds?: string[];
  sellerIds?: string[];
  isSubSubcategoryPage?: boolean;
  limit?: number;
}): Promise<
  Result<
    Array<{
      product_id: string;
      value_text: string;
      listings: {
        id: string;
        status: string;
        seller_id: string;
        category_id?: string | null;
        subcategory_id?: string | null;
        sub_subcategory_id?: string | null;
        sub_sub_subcategory_id?: string | null;
        brand_id?: string | null;
      };
    }>
  >
> {
  try {
    const {
      attributeId,
      categoryId,
      subcategoryId,
      subSubcategoryId,
      subSubSubcategoryIds,
      brandIds,
      sellerIds,
      isSubSubcategoryPage,
      limit = 50000,
    } = params;

    let query = supabase
      .from('product_attribute_values')
      .select(
        'product_id, value_text, listings!inner(id, status, seller_id, category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id, brand_id)',
      )
      .eq('attribute_id', attributeId)
      .not('value_text', 'is', null)
      .eq('listings.status', 'published');

    if (sellerIds && sellerIds.length > 0) {
      query = query.in('listings.seller_id', sellerIds);
    }

    if (categoryId) {
      query = query.eq('listings.category_id', categoryId);
    }
    if (subcategoryId) {
      query = query.eq('listings.subcategory_id', subcategoryId);
    }
    if (subSubcategoryId && isSubSubcategoryPage) {
      query = query.eq('listings.sub_subcategory_id', subSubcategoryId);
    }
    if (subSubSubcategoryIds && subSubSubcategoryIds.length > 0) {
      query = query.in('listings.sub_sub_subcategory_id', subSubSubcategoryIds);
    }
    if (brandIds && brandIds.length > 0) {
      query = query.in('listings.brand_id', brandIds);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;
    return success(
      (data || []) as Array<{
        product_id: string;
        value_text: string;
        listings: {
          id: string;
          status: string;
          seller_id: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          sub_subcategory_id?: string | null;
          sub_sub_subcategory_id?: string | null;
          brand_id?: string | null;
        };
      }>,
    );
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeFilterValues');
    return failure(normalizeError(error));
  }
}

// Fetch attribute by name
export async function fetchAttributeByName(name: string): Promise<Result<Attribute | null>> {
  try {
    const { data, error } = await supabase.from('attributes').select('*').eq('name', name).maybeSingle();

    if (error) throw error;
    return success((data || null) as Attribute | null);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeByName');
    return failure(normalizeError(error));
  }
}

// Fetch attribute by name pattern (for colour/color, size, etc.)
export async function fetchAttributeByNamePattern(pattern: string): Promise<Result<Attribute | null>> {
  try {
    const { data, error } = await supabase
      .from('attributes')
      .select('id, name')
      .ilike('name', `%${pattern}%`)
      .or(`name.ilike.%${pattern}%`)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return success((data || null) as Attribute | null);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeByNamePattern');
    return failure(normalizeError(error));
  }
}

// Fetch product attribute values by attribute ID for filtering
export async function fetchProductAttributeValuesByAttributeId(
  attributeId: string,
  limit: number = 50000,
): Promise<Result<Array<{ product_id: string; value_text: string | null }>>> {
  try {
    const { data, error } = await supabase
      .from('product_attribute_values')
      .select('product_id, value_text')
      .eq('attribute_id', attributeId)
      .limit(limit);

    if (error) throw error;
    return success((data || []) as Array<{ product_id: string; value_text: string | null }>);
  } catch (error) {
    logError(error, 'attributeService:fetchProductAttributeValuesByAttributeId');
    return failure(normalizeError(error));
  }
}

// Admin functions for attribute management
export interface AttributeGroup {
  id: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttributeOption {
  id: string;
  attribute_id: string;
  value: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAttributeInput {
  name: string;
  display_label?: string | null;
  data_type: string;
  is_required: boolean;
  display_order: number;
  category_id: string;
  group_id?: string | null;
}

export interface UpdateAttributeInput {
  name?: string;
  display_label?: string | null;
  data_type?: string;
  is_required?: boolean;
  group_id?: string | null;
}

// Fetch all attributes (admin)
export async function fetchAllAttributes(): Promise<Result<Attribute[]>> {
  try {
    const { data, error } = await supabase
      .from('attributes')
      .select('id, name, category_id, data_type, display_label, is_required, display_order, group_id')
      .order('display_order');

    if (error) throw error;
    return success((data || []) as Attribute[]);
  } catch (error) {
    logError(error, 'attributeService:fetchAllAttributes');
    return failure(normalizeError(error));
  }
}

// Fetch attribute-subcategory links
export async function fetchAttributeSubcategories(): Promise<
  Result<Array<{ attribute_id: string; subcategory_id: string }>>
> {
  try {
    const { data, error } = await supabase.from('attribute_subcategories').select('attribute_id, subcategory_id');

    if (error) throw error;
    return success((data || []) as Array<{ attribute_id: string; subcategory_id: string }>);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeSubcategories');
    return failure(normalizeError(error));
  }
}

// Fetch attribute-subsubcategory links
export async function fetchAttributeSubSubcategories(): Promise<
  Result<Array<{ attribute_id: string; sub_subcategory_id: string }>>
> {
  try {
    const { data, error } = await supabase
      .from('attribute_sub_subcategories')
      .select('attribute_id, sub_subcategory_id');

    if (error) throw error;
    return success((data || []) as Array<{ attribute_id: string; sub_subcategory_id: string }>);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeSubSubcategories');
    return failure(normalizeError(error));
  }
}

// Fetch attribute options
export async function fetchAttributeOptions(
  limit: number = 10000,
): Promise<Result<Array<{ attribute_id: string; value: string }>>> {
  try {
    const { data, error } = await supabase
      .from('attribute_options')
      .select('attribute_id, value')
      .eq('is_active', true)
      .limit(limit);

    if (error) throw error;
    return success((data || []) as Array<{ attribute_id: string; value: string }>);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeOptions');
    return failure(normalizeError(error));
  }
}

// Fetch attribute options by attribute ID
export async function fetchAttributeOptionsByAttributeId(
  attributeId: string,
): Promise<Result<Array<{ value: string }>>> {
  try {
    const { data, error } = await supabase
      .from('attribute_options')
      .select('value')
      .eq('attribute_id', attributeId)
      .eq('is_active', true);

    if (error) throw error;
    return success((data || []) as Array<{ value: string }>);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeOptionsByAttributeId');
    return failure(normalizeError(error));
  }
}

// Fetch attribute options with IDs by attribute ID
export async function fetchAttributeOptionsWithIdsByAttributeId(
  attributeId: string,
): Promise<Result<Array<{ id: string; value: string }>>> {
  try {
    const { data, error } = await supabase
      .from('attribute_options')
      .select('id, value')
      .eq('attribute_id', attributeId)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return success((data || []) as Array<{ id: string; value: string }>);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeOptionsWithIdsByAttributeId');
    return failure(normalizeError(error));
  }
}

// Fetch color attribute options (for filters)
export async function fetchColorAttributeOptions(): Promise<Result<string[]>> {
  try {
    // Find the main Colour attribute (exact match to avoid multiple results)
    const { data: attrData, error: attrError } = await supabase
      .from('attributes')
      .select('id')
      .eq('name', 'Colour')
      .maybeSingle();

    if (attrError) throw attrError;
    if (!attrData) return success([]);

    const colorAttrId = attrData.id;

    // Get all color options
    const { data, error } = await supabase
      .from('attribute_options')
      .select('value')
      .eq('attribute_id', colorAttrId)
      .eq('is_active', true)
      .order('value')
      .limit(10000);

    if (error) throw error;
    return success((data || []).map((opt: { value: string }) => opt.value));
  } catch (error) {
    logError(error, 'attributeService:fetchColorAttributeOptions');
    return failure(normalizeError(error));
  }
}

// Fetch all attributes with their options (for product forms)
export async function fetchAllAttributesWithOptions(): Promise<
  Result<
    Array<{ id: string; name: string; data_type: string; attribute_options: Array<{ id: string; value: string }> }>
  >
> {
  try {
    const { data, error } = await supabase
      .from('attributes')
      .select('id, name, data_type, attribute_options(id, value)');

    if (error) throw error;
    return success(
      (data || []) as Array<{
        id: string;
        name: string;
        data_type: string;
        attribute_options: Array<{ id: string; value: string }>;
      }>,
    );
  } catch (error) {
    logError(error, 'attributeService:fetchAllAttributesWithOptions');
    return failure(normalizeError(error));
  }
}

// Fetch attribute-subcategory relationships for multiple subcategories
export async function fetchAttributeSubcategoriesBySubcategoryIds(subcategoryIds: string[]): Promise<
  Result<
    Array<{
      subcategory_id: string;
      attribute_id: string;
      attributes: {
        id: string;
        name: string;
        data_type: string;
        display_order: number | null;
        attribute_options?: Array<{
          id: string;
          value: string;
        }>;
      } | null;
    }>
  >
> {
  try {
    if (subcategoryIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('attribute_subcategories')
      .select(
        `
          subcategory_id,
          attribute_id,
          attributes (
            id,
            name,
            data_type,
            display_order,
            attribute_options (
              id,
              value
            )
          )
        `,
      )
      .in('subcategory_id', subcategoryIds);

    if (error) throw error;
    return success(
      (data || []) as Array<{
        subcategory_id: string;
        attribute_id: string;
        attributes: {
          id: string;
          name: string;
          data_type: string;
          display_order: number | null;
          attribute_options?: Array<{
            id: string;
            value: string;
          }>;
        } | null;
      }>,
    );
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeSubcategoriesBySubcategoryIds');
    return failure(normalizeError(error));
  }
}

// Fetch product IDs filtered by attribute values with listing filters
export async function fetchProductIdsByAttributeValues(params: {
  attributeId: string;
  selectedValues: string[];
  categoryId?: string | null;
  subcategoryId?: string | null;
  subSubcategoryId?: string | null;
  subSubSubcategoryIds?: string[];
  brandIds?: string[];
  sellerIds?: string[];
  isSubSubcategoryPage?: boolean;
  limit?: number;
}): Promise<Result<string[]>> {
  try {
    const {
      attributeId,
      selectedValues,
      categoryId,
      subcategoryId,
      subSubcategoryId,
      subSubSubcategoryIds,
      brandIds,
      sellerIds,
      isSubSubcategoryPage,
      limit = 50000,
    } = params;

    let query = supabase
      .from('product_attribute_values')
      .select(
        'product_id, value_text, listings!inner(id, status, seller_id, category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id, brand_id)',
      )
      .eq('attribute_id', attributeId)
      .eq('listings.status', 'published')
      .not('value_text', 'is', null);

    if (sellerIds && sellerIds.length > 0) {
      query = query.in('listings.seller_id', sellerIds);
    }

    if (categoryId) {
      query = query.eq('listings.category_id', categoryId);
    }
    if (subcategoryId) {
      query = query.eq('listings.subcategory_id', subcategoryId);
    }
    if (subSubcategoryId && isSubSubcategoryPage) {
      query = query.eq('listings.sub_subcategory_id', subSubcategoryId);
    }
    if (subSubSubcategoryIds && subSubSubcategoryIds.length > 0) {
      query = query.in('listings.sub_sub_subcategory_id', subSubSubcategoryIds);
    }
    if (brandIds && brandIds.length > 0) {
      query = query.in('listings.brand_id', brandIds);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;

    // Parse attribute values and match against selected values
    const normalizedFilters = selectedValues.map((v) => v.trim().toLowerCase());
    const matchingProductIds = new Set<string>();

    // Helper to parse attribute values
    function parseAttributeValues(valueText: string | null): string[] {
      if (!valueText) return [];
      try {
        const parsed = JSON.parse(valueText);
        if (Array.isArray(parsed)) return parsed.map(String);
        return [String(parsed)];
      } catch {
        return valueText.includes(',') ? valueText.split(',') : [valueText];
      }
    }

    data?.forEach((pav: { value_text: string; attribute_options?: { value: string } }) => {
      const values = parseAttributeValues(pav.value_text);
      const normalized = values.map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (normalized.some((v) => normalizedFilters.includes(v))) {
        matchingProductIds.add(pav.product_id);
      }
    });

    return success(Array.from(matchingProductIds));
  } catch (error) {
    logError(error, 'attributeService:fetchProductIdsByAttributeValues');
    return failure(normalizeError(error));
  }
}

// Fetch available attribute values (e.g., colors, sizes) with listing filters
export async function fetchAvailableAttributeValues(params: {
  attributeId: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  subSubcategoryId?: string | null;
  subSubSubcategoryIds?: string[];
  brandIds?: string[];
  sellerIds?: string[];
  isSubSubcategoryPage?: boolean;
  filteredProductIds?: string[];
  limit?: number;
}): Promise<Result<string[]>> {
  try {
    const {
      attributeId,
      categoryId,
      subcategoryId,
      subSubcategoryId,
      subSubSubcategoryIds,
      brandIds,
      sellerIds,
      isSubSubcategoryPage,
      filteredProductIds,
      limit = 50000,
    } = params;

    let query = supabase
      .from('product_attribute_values')
      .select(
        'value_text, listings!inner(id, status, seller_id, category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id, brand_id)',
      )
      .eq('attribute_id', attributeId)
      .not('value_text', 'is', null)
      .eq('listings.status', 'published');

    if (sellerIds && sellerIds.length > 0) {
      query = query.in('listings.seller_id', sellerIds);
    }

    if (categoryId) {
      query = query.eq('listings.category_id', categoryId);
    }
    if (subcategoryId) {
      query = query.eq('listings.subcategory_id', subcategoryId);
    }
    if (subSubcategoryId && isSubSubcategoryPage) {
      query = query.eq('listings.sub_subcategory_id', subSubcategoryId);
    }
    if (subSubSubcategoryIds && subSubSubcategoryIds.length > 0) {
      query = query.in('listings.sub_sub_subcategory_id', subSubSubcategoryIds);
    }
    if (brandIds && brandIds.length > 0) {
      query = query.in('listings.brand_id', brandIds);
    }
    if (filteredProductIds && filteredProductIds.length > 0) {
      query = query.in('listings.id', filteredProductIds);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;

    // Parse attribute values and collect unique values
    const valuesSet = new Set<string>();

    // Helper to parse attribute values
    function parseAttributeValues(valueText: string | null): string[] {
      if (!valueText) return [];
      try {
        const parsed = JSON.parse(valueText);
        if (Array.isArray(parsed)) return parsed.map(String);
        return [String(parsed)];
      } catch {
        return valueText.includes(',') ? valueText.split(',') : [valueText];
      }
    }

    data?.forEach((cv: { value_text: string; attribute_options?: { value: string } }) => {
      const values = parseAttributeValues(cv.value_text);
      values.forEach((value) => {
        const trimmed = value.trim();
        if (trimmed) valuesSet.add(trimmed);
      });
    });

    return success(Array.from(valuesSet));
  } catch (error) {
    logError(error, 'attributeService:fetchAvailableAttributeValues');
    return failure(normalizeError(error));
  }
}

// Fetch attribute-subsubcategory relationships for multiple sub-subcategories
export async function fetchAttributeSubSubcategoriesBySubSubcategoryIds(subSubcategoryIds: string[]): Promise<
  Result<
    Array<{
      sub_subcategory_id: string;
      attribute_id: string;
      attributes: {
        id: string;
        name: string;
        data_type: string;
        display_order: number | null;
        attribute_options?: Array<{
          id: string;
          value: string;
        }>;
      } | null;
    }>
  >
> {
  try {
    if (subSubcategoryIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('attribute_sub_subcategories')
      .select(
        `
        sub_subcategory_id,
        attribute_id,
        attributes (
          id,
          name,
          data_type,
          display_order,
          attribute_options (
            id,
            value
          )
        )
      `,
      )
      .in('sub_subcategory_id', subSubcategoryIds);

    if (error) throw error;
    return success(
      (data || []) as Array<{
        sub_subcategory_id: string;
        attribute_id: string;
        attributes: {
          id: string;
          name: string;
          data_type: string;
          display_order: number | null;
          attribute_options?: Array<{
            id: string;
            value: string;
          }>;
        } | null;
      }>,
    );
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeSubSubcategoriesBySubSubcategoryIds');
    return failure(normalizeError(error));
  }
}

// Fetch attribute-category relationships for a category
export async function fetchAttributeCategoriesByCategoryId(categoryId: string): Promise<
  Result<
    Array<{
      attribute_id: string;
      attributes: {
        id: string;
        name: string;
        data_type: string;
        attribute_options: Array<{
          id: string;
          value: string;
        }>;
      } | null;
    }>
  >
> {
  try {
    const { data, error } = await supabase
      .from('attribute_categories')
      .select(
        `
        attribute_id,
        attributes (
          id,
          name,
          data_type,
          attribute_options (
            id,
            value
          )
        )
      `,
      )
      .eq('category_id', categoryId);

    if (error) throw error;
    return success(
      (data || []) as Array<{
        attribute_id: string;
        attributes: {
          id: string;
          name: string;
          data_type: string;
          attribute_options: Array<{
            id: string;
            value: string;
          }>;
        } | null;
      }>,
    );
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeCategoriesByCategoryId');
    return failure(normalizeError(error));
  }
}

// Bulk insert attribute values
export async function bulkInsertAttributeValues(
  attributeValues: Array<{
    product_id: string;
    attribute_id: string;
    value_text?: string | null;
    value_number?: number | null;
    value_boolean?: boolean | null;
    value_date?: string | null;
  }>,
): Promise<Result<boolean>> {
  try {
    if (attributeValues.length === 0) {
      return success(true);
    }

    const { error } = await supabase.from('product_attribute_values').insert(attributeValues);
    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'attributeService:bulkInsertAttributeValues');
    return failure(normalizeError(error));
  }
}

// Bulk update attribute values
export async function bulkUpdateAttributeValues(
  updates: Array<{
    id: string;
    value_text?: string | null;
    value_number?: number | null;
    value_boolean?: boolean | null;
    value_date?: string | null;
  }>,
): Promise<Result<boolean>> {
  try {
    if (updates.length === 0) {
      return success(true);
    }

    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const updatePromises = batch.map((attr) =>
        supabase
          .from('product_attribute_values')
          .update({
            value_text: attr.value_text,
            value_number: attr.value_number,
            value_boolean: attr.value_boolean,
            value_date: attr.value_date,
          })
          .eq('id', attr.id),
      );

      const results = await Promise.all(updatePromises);
      for (const result of results) {
        if (result.error) {
          throw result.error;
        }
      }
    }

    return success(true);
  } catch (error) {
    logError(error, 'attributeService:bulkUpdateAttributeValues');
    return failure(normalizeError(error));
  }
}

// Admin functions for attribute management
export interface AttributeGroup {
  id: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttributeOption {
  id: string;
  attribute_id: string;
  value: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAttributeInput {
  name: string;
  display_label?: string | null;
  data_type: string;
  is_required: boolean;
  display_order: number;
  category_id: string;
  group_id?: string | null;
}

export interface UpdateAttributeInput {
  name?: string;
  display_label?: string | null;
  data_type?: string;
  is_required?: boolean;
  group_id?: string | null;
}

// Create attribute
export async function createAttribute(input: CreateAttributeInput): Promise<Result<Attribute>> {
  try {
    const { data, error } = await supabase.from('attributes').insert(input).select().single();

    if (error) throw error;
    return success(data as Attribute);
  } catch (error) {
    logError(error, 'attributeService:createAttribute');
    return failure(normalizeError(error));
  }
}

// Update attribute
export async function updateAttribute(attributeId: string, input: UpdateAttributeInput): Promise<Result<Attribute>> {
  try {
    const { data, error } = await supabase.from('attributes').update(input).eq('id', attributeId).select().single();

    if (error) throw error;
    return success(data as Attribute);
  } catch (error) {
    logError(error, 'attributeService:updateAttribute');
    return failure(normalizeError(error));
  }
}

// Delete attribute
export async function deleteAttribute(attributeId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('attributes').delete().eq('id', attributeId);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'attributeService:deleteAttribute');
    return failure(normalizeError(error));
  }
}

// Fetch all attribute groups
export async function fetchAttributeGroups(): Promise<Result<AttributeGroup[]>> {
  try {
    const { data, error } = await supabase
      .from('attribute_groups')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return success((data || []) as AttributeGroup[]);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeGroups');
    return failure(normalizeError(error));
  }
}

// Create attribute group
export async function createAttributeGroup(input: {
  name: string;
  description?: string | null;
}): Promise<Result<AttributeGroup>> {
  try {
    // Get max display order
    const { data: existing } = await supabase
      .from('attribute_groups')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;

    const { data, error } = await supabase
      .from('attribute_groups')
      .insert({
        name: input.name,
        description: input.description || null,
        display_order: nextOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return success(data as AttributeGroup);
  } catch (error) {
    logError(error, 'attributeService:createAttributeGroup');
    return failure(normalizeError(error));
  }
}

// Update attribute group
export async function updateAttributeGroup(
  groupId: string,
  input: { name: string; description?: string | null },
): Promise<Result<AttributeGroup>> {
  try {
    const { data, error } = await supabase
      .from('attribute_groups')
      .update({
        name: input.name,
        description: input.description || null,
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return success(data as AttributeGroup);
  } catch (error) {
    logError(error, 'attributeService:updateAttributeGroup');
    return failure(normalizeError(error));
  }
}

// Delete attribute group
export async function deleteAttributeGroup(groupId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('attribute_groups').delete().eq('id', groupId);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'attributeService:deleteAttributeGroup');
    return failure(normalizeError(error));
  }
}

// Fetch attribute options with full details (admin)
export async function fetchAttributeOptionsFull(attributeId: string): Promise<Result<AttributeOption[]>> {
  try {
    const { data, error } = await supabase
      .from('attribute_options')
      .select('*')
      .eq('attribute_id', attributeId)
      .order('display_order', { ascending: true })
      .limit(10000);

    if (error) throw error;
    return success((data || []) as AttributeOption[]);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeOptionsFull');
    return failure(normalizeError(error));
  }
}

// Create attribute option
export async function createAttributeOption(
  attributeId: string,
  value: string,
  displayOrder?: number,
): Promise<Result<AttributeOption>> {
  try {
    let order = displayOrder;
    if (order === undefined) {
      // Get max display order
      const { data: existing } = await supabase
        .from('attribute_options')
        .select('display_order')
        .eq('attribute_id', attributeId)
        .order('display_order', { ascending: false })
        .limit(1);

      order = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;
    }

    const { data, error } = await supabase
      .from('attribute_options')
      .insert({
        attribute_id: attributeId,
        value,
        is_active: true,
        display_order: order,
      })
      .select()
      .single();

    if (error) throw error;
    return success(data as AttributeOption);
  } catch (error) {
    logError(error, 'attributeService:createAttributeOption');
    return failure(normalizeError(error));
  }
}

// Bulk create attribute options
export async function bulkCreateAttributeOptions(
  attributeId: string,
  values: string[],
): Promise<Result<AttributeOption[]>> {
  try {
    // Get current max display order
    const { data: existing } = await supabase
      .from('attribute_options')
      .select('display_order')
      .eq('attribute_id', attributeId)
      .order('display_order', { ascending: false })
      .limit(1);

    let nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;

    const optionsToInsert = values.map((value) => ({
      attribute_id: attributeId,
      value,
      is_active: true,
      display_order: nextOrder++,
    }));

    const { data, error } = await supabase.from('attribute_options').insert(optionsToInsert).select();

    if (error) throw error;
    return success((data || []) as AttributeOption[]);
  } catch (error) {
    logError(error, 'attributeService:bulkCreateAttributeOptions');
    return failure(normalizeError(error));
  }
}

// Update attribute option
export async function updateAttributeOption(
  optionId: string,
  updates: { is_active?: boolean; value?: string; display_order?: number },
): Promise<Result<AttributeOption>> {
  try {
    const { data, error } = await supabase
      .from('attribute_options')
      .update(updates)
      .eq('id', optionId)
      .select()
      .single();

    if (error) throw error;
    return success(data as AttributeOption);
  } catch (error) {
    logError(error, 'attributeService:updateAttributeOption');
    return failure(normalizeError(error));
  }
}

// Delete attribute option
export async function deleteAttributeOption(optionId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('attribute_options').delete().eq('id', optionId);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'attributeService:deleteAttributeOption');
    return failure(normalizeError(error));
  }
}

// Fetch attribute option counts (for admin display)
export async function fetchAttributeOptionCounts(): Promise<Result<Record<string, number>>> {
  try {
    const PAGE_SIZE = 1000;
    let from = 0;
    let to = PAGE_SIZE - 1;
    const counts: Record<string, number> = {};

    while (true) {
      const { data, error } = await supabase
        .from('attribute_options')
        .select('attribute_id')
        .eq('is_active', true)
        .range(from, to);

      if (error) throw error;
      const batch = data || [];

      batch.forEach((option) => {
        counts[option.attribute_id] = (counts[option.attribute_id] || 0) + 1;
      });

      if (batch.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
      to += PAGE_SIZE;
    }

    return success(counts);
  } catch (error) {
    logError(error, 'attributeService:fetchAttributeOptionCounts');
    return failure(normalizeError(error));
  }
}

// Attribute-Category Link Management
// These interfaces are for managing links between attributes and categories
export interface AttributeCategoryLinkSimple {
  attribute_id: string;
  category_id: string;
}

export interface AttributeSubcategoryLink {
  attribute_id: string;
  subcategory_id: string;
}

export interface AttributeSubSubcategoryLink {
  attribute_id: string;
  sub_subcategory_id: string;
}

// Fetch all attribute-category links
export async function fetchAttributeCategoryLinks(): Promise<Result<AttributeCategoryLinkSimple[]>> {
  try {
    const { data, error } = await supabase.from('attribute_categories').select('*');

    if (error) {
      logError(error, 'fetchAttributeCategoryLinks');
      return failure(normalizeError(error));
    }

    return success((data || []) as AttributeCategoryLinkSimple[]);
  } catch (error) {
    logError(error, 'fetchAttributeCategoryLinks');
    return failure(normalizeError(error));
  }
}

// Fetch all attribute-subcategory links
export async function fetchAttributeSubcategoryLinks(): Promise<Result<AttributeSubcategoryLink[]>> {
  try {
    const { data, error } = await supabase.from('attribute_subcategories').select('*');

    if (error) {
      logError(error, 'fetchAttributeSubcategoryLinks');
      return failure(normalizeError(error));
    }

    return success((data || []) as AttributeSubcategoryLink[]);
  } catch (error) {
    logError(error, 'fetchAttributeSubcategoryLinks');
    return failure(normalizeError(error));
  }
}

// Fetch all attribute-sub-subcategory links
export async function fetchAttributeSubSubcategoryLinks(): Promise<Result<AttributeSubSubcategoryLink[]>> {
  try {
    const { data, error } = await supabase.from('attribute_sub_subcategories').select('*');

    if (error) {
      logError(error, 'fetchAttributeSubSubcategoryLinks');
      return failure(normalizeError(error));
    }

    return success((data || []) as AttributeSubSubcategoryLink[]);
  } catch (error) {
    logError(error, 'fetchAttributeSubSubcategoryLinks');
    return failure(normalizeError(error));
  }
}

// Link attribute to category
export async function linkAttributeToCategory(attributeId: string, categoryId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('attribute_categories').insert({
      attribute_id: attributeId,
      category_id: categoryId,
    });

    if (error) {
      logError(error, 'linkAttributeToCategory');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'linkAttributeToCategory');
    return failure(normalizeError(error));
  }
}

// Unlink attribute from category
export async function unlinkAttributeFromCategory(attributeId: string, categoryId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase
      .from('attribute_categories')
      .delete()
      .eq('attribute_id', attributeId)
      .eq('category_id', categoryId);

    if (error) {
      logError(error, 'unlinkAttributeFromCategory');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'unlinkAttributeFromCategory');
    return failure(normalizeError(error));
  }
}

// Link attribute to subcategory
export async function linkAttributeToSubcategory(attributeId: string, subcategoryId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('attribute_subcategories').insert({
      attribute_id: attributeId,
      subcategory_id: subcategoryId,
    });

    if (error) {
      logError(error, 'linkAttributeToSubcategory');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'linkAttributeToSubcategory');
    return failure(normalizeError(error));
  }
}

// Unlink attribute from subcategory
export async function unlinkAttributeFromSubcategory(
  attributeId: string,
  subcategoryId: string,
): Promise<Result<boolean>> {
  try {
    const { error } = await supabase
      .from('attribute_subcategories')
      .delete()
      .eq('attribute_id', attributeId)
      .eq('subcategory_id', subcategoryId);

    if (error) {
      logError(error, 'unlinkAttributeFromSubcategory');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'unlinkAttributeFromSubcategory');
    return failure(normalizeError(error));
  }
}

// Link attribute to sub-subcategory
export async function linkAttributeToSubSubcategory(
  attributeId: string,
  subSubcategoryId: string,
): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('attribute_sub_subcategories').insert({
      attribute_id: attributeId,
      sub_subcategory_id: subSubcategoryId,
    });

    if (error) {
      logError(error, 'linkAttributeToSubSubcategory');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'linkAttributeToSubSubcategory');
    return failure(normalizeError(error));
  }
}

// Unlink attribute from sub-subcategory
export async function unlinkAttributeFromSubSubcategory(
  attributeId: string,
  subSubcategoryId: string,
): Promise<Result<boolean>> {
  try {
    const { error } = await supabase
      .from('attribute_sub_subcategories')
      .delete()
      .eq('attribute_id', attributeId)
      .eq('sub_subcategory_id', subSubcategoryId);

    if (error) {
      logError(error, 'unlinkAttributeFromSubSubcategory');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'unlinkAttributeFromSubSubcategory');
    return failure(normalizeError(error));
  }
}
