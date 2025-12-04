// Tags Service
// Centralized data access for tag-related operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';
import { isFailure } from '@/types/api';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  is_active?: boolean | null;
  is_featured?: boolean | null;
  category_id?: string | null;
  display_order?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TagFilters {
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
  search?: string;
}

export interface CreateTagInput {
  name: string;
  slug: string;
  description?: string | null;
  color?: string;
  is_active?: boolean;
  is_featured?: boolean;
  category_id?: string | null;
  display_order?: number;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  category_id?: string | null;
  display_order?: number;
}

// Fetch all tags with optional filters
export async function fetchTags(filters: TagFilters = {}): Promise<Result<Tag[]>> {
  return withErrorHandling(async () => {
    let query = supabase.from('product_tags').select('*').order('name', { ascending: true });

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data as Tag[], error: null };
  }, 'fetchTags');
}

// Fetch a single tag by ID
export async function fetchTagById(tagId: string): Promise<Result<Tag>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('product_tags').select('*').eq('id', tagId).single();

    if (error) throw error;
    return { data: data as Tag, error: null };
  }, 'fetchTagById');
}

// Fetch tag by slug
export async function fetchTagBySlug(slug: string): Promise<Result<Tag | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('product_tags').select('*').eq('slug', slug).maybeSingle();

    if (error) throw error;
    return { data: data as Tag | null, error: null };
  }, 'fetchTagBySlug') as Promise<Result<Tag | null>>;
}

// Fetch featured tags
export async function fetchFeaturedTags(categoryId?: string): Promise<Result<Tag[]>> {
  return withErrorHandling(async () => {
    let query = supabase.from('product_tags').select('*').eq('is_featured', true).eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data as Tag[], error: null };
  }, 'fetchFeaturedTags');
}

// Featured tag with category name
export interface FeaturedTagWithCategory {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
}

// Fetch featured tags with category names
export async function fetchFeaturedTagsWithCategories(): Promise<Result<FeaturedTagWithCategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_tags')
      .select('id, name, slug, category_id, product_categories(name)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .not('category_id', 'is', null);

    if (error) throw error;

    const tags = (data || []).map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      categoryName: tag.product_categories?.name || 'Unknown',
    }));

    return { data: tags, error: null };
  }, 'fetchFeaturedTagsWithCategories');
}

// Create a new tag
export async function createTag(input: CreateTagInput): Promise<Result<Tag | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_tags')
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description,
        color: input.color,
        is_active: input.is_active ?? true,
        is_featured: input.is_featured ?? false,
        category_id: input.category_id,
        display_order: input.display_order,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Tag, error: null };
  }, 'createTag');
}

// Update a tag
export async function updateTag(tagId: string, updates: UpdateTagInput): Promise<Result<Tag | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('product_tags').update(updates).eq('id', tagId).select().single();

    if (error) throw error;
    return { data: data as Tag, error: null };
  }, 'updateTag');
}

// Delete a tag
export async function deleteTag(tagId: string): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase.from('product_tags').delete().eq('id', tagId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteTag');
}

// Fetch tags for a product
export async function fetchProductTags(productId: string): Promise<Result<Tag[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_tag_links')
      .select('product_tags(*)')
      .eq('product_id', productId);

    if (error) throw error;
    const tags = data?.map((link) => link.product_tags).filter(Boolean) as Tag[];
    return { data: tags || [], error: null };
  }, 'fetchProductTags');
}

// Link tag to product
export async function linkTagToProduct(productId: string, tagId: string): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase.from('product_tag_links').insert({ product_id: productId, tag_id: tagId });

    if (error) throw error;
    return { data: true, error: null };
  }, 'linkTagToProduct');
}

// Unlink tag from product
export async function unlinkTagFromProduct(productId: string, tagId: string): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase.from('product_tag_links').delete().eq('product_id', productId).eq('tag_id', tagId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'unlinkTagFromProduct');
}

// Bulk update product tags (replace all)
export async function bulkUpdateProductTags(productId: string, tagIds: string[]): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    // Delete existing links
    const { error: deleteError } = await supabase.from('product_tag_links').delete().eq('product_id', productId);

    if (deleteError) throw deleteError;

    // Insert new links
    if (tagIds.length > 0) {
      const { error: insertError } = await supabase
        .from('product_tag_links')
        .insert(tagIds.map((tagId) => ({ product_id: productId, tag_id: tagId })));

      if (insertError) throw insertError;
    }

    return { data: true, error: null };
  }, 'bulkUpdateProductTags');
}

// Fetch tag details with linked products
export interface TagWithProducts extends Tag {
  product_count: number;
  products: Array<{
    id: string;
    product_name: string;
    thumbnail: string | null;
  }>;
}

// Fetch tags for multiple products
export async function fetchTagsForProducts(productIds: string[]): Promise<
  Result<
    Array<{
      product_id: string;
      product_tags: { id: string; name: string; color: string | null } | null;
    }>
  >
> {
  return withErrorHandling(async () => {
    if (productIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('product_tag_links')
      .select('product_id, product_tags(id, name, color)')
      .in('product_id', productIds);

    if (error) throw error;
    return {
      data: (data || []) as Array<{
        product_id: string;
        product_tags: { id: string; name: string; color: string | null } | null;
      }>,
      error: null,
    };
  }, 'fetchTagsForProducts');
}

// Fetch tag links for multiple products (returns product_id and tag_id pairs)
export async function fetchTagLinksForProducts(
  productIds: string[],
): Promise<Result<Array<{ product_id: string; tag_id: string }>>> {
  return withErrorHandling(async () => {
    if (productIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('product_tag_links')
      .select('product_id, tag_id')
      .in('product_id', productIds);

    if (error) throw error;
    return {
      data: (data || []) as Array<{ product_id: string; tag_id: string }>,
      error: null,
    };
  }, 'fetchTagLinksForProducts');
}

// Fetch tag links for a single product
export async function fetchTagLinksForProduct(productId: string): Promise<Result<Array<{ tag_id: string }>>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('product_tag_links').select('tag_id').eq('product_id', productId);

    if (error) throw error;
    return {
      data: (data || []) as Array<{ tag_id: string }>,
      error: null,
    };
  }, 'fetchTagLinksForProduct');
}

// Update product tags (safe upsert - only add/remove changed tags)
export async function updateProductTags(
  productId: string,
  tagIds: string[],
): Promise<Result<{ added: number; removed: number }>> {
  return withMutation(async () => {
    // Get existing tags
    const existingResult = await fetchTagLinksForProduct(productId);
    if (isFailure(existingResult)) throw existingResult.error;

    const existingTagIds = new Set((existingResult.data || []).map((t) => t.tag_id));
    const newTagIds = new Set(tagIds);

    // Find tags to remove
    const tagsToRemove = [...existingTagIds].filter((id) => !newTagIds.has(id));
    // Find tags to add
    const tagsToAdd = tagIds.filter((id) => !existingTagIds.has(id));

    // Remove tags
    if (tagsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('product_tag_links')
        .delete()
        .eq('product_id', productId)
        .in('tag_id', tagsToRemove);

      if (deleteError) throw deleteError;
    }

    // Add new tags
    if (tagsToAdd.length > 0) {
      const tagLinks = tagsToAdd.map((tagId) => ({
        product_id: productId,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase.from('product_tag_links').insert(tagLinks);
      if (insertError) throw insertError;
    }

    return {
      data: { added: tagsToAdd.length, removed: tagsToRemove.length },
      error: null,
    };
  }, 'updateProductTags');
}

// Bulk update product tags (remove and add tags for a product)
export async function bulkUpdateProductTagsForProduct(
  productId: string,
  tagsToRemove: string[],
  tagsToAdd: string[],
): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    // Remove tags
    if (tagsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('product_tag_links')
        .delete()
        .eq('product_id', productId)
        .in('tag_id', tagsToRemove);

      if (deleteError) throw deleteError;
    }

    // Add tags
    if (tagsToAdd.length > 0) {
      const newTagLinks = tagsToAdd.map((tagId) => ({ product_id: productId, tag_id: tagId }));
      const { error: insertError } = await supabase.from('product_tag_links').insert(newTagLinks);

      if (insertError) throw insertError;
    }

    return { data: true, error: null };
  }, 'bulkUpdateProductTagsForProduct');
}

export async function fetchTagDetailsWithProducts(tagId: string): Promise<Result<TagWithProducts>> {
  return withErrorHandling(async () => {
    // Fetch tag
    const { data: tag, error: tagError } = await supabase.from('product_tags').select('*').eq('id', tagId).single();

    if (tagError) throw tagError;

    // Fetch linked products
    const { data: links, error: linksError } = await supabase
      .from('product_tag_links')
      .select(
        `
        product_id,
        listings (
          id,
          product_name,
          thumbnail
        )
      `,
      )
      .eq('tag_id', tagId);

    if (linksError) throw linksError;

    const products =
      links?.map((link: any) => ({
        id: link.listings.id,
        product_name: link.listings.product_name,
        thumbnail: link.listings.thumbnail,
      })) || [];

    return {
      data: {
        ...tag,
        product_count: products.length,
        products,
      } as TagWithProducts,
      error: null,
    };
  }, 'fetchTagDetailsWithProducts');
}

// Fetch product IDs by tag ID
export async function fetchProductIdsByTagId(tagId: string): Promise<Result<string[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('product_tag_links').select('product_id').eq('tag_id', tagId);

    if (error) throw error;
    return { data: (data || []).map((link) => link.product_id), error: null };
  }, 'fetchProductIdsByTagId');
}
