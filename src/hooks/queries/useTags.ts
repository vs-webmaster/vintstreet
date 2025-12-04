// Tags Query Hooks
// React Query hooks for tag data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTags,
  fetchTagById,
  fetchTagBySlug,
  fetchFeaturedTags,
  fetchProductTags,
  createTag,
  updateTag,
  deleteTag,
  linkTagToProduct,
  unlinkTagFromProduct,
  bulkUpdateProductTags,
  type TagFilters,
  type CreateTagInput,
  type UpdateTagInput,
} from '@/services/tags';
import { isSuccess } from '@/types/api';

// Query key factory for tags
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (filters: TagFilters) => [...tagKeys.lists(), filters] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagKeys.details(), id] as const,
  bySlug: (slug: string) => [...tagKeys.all, 'slug', slug] as const,
  featured: (categoryId?: string) => [...tagKeys.all, 'featured', categoryId] as const,
  product: (productId: string) => [...tagKeys.all, 'product', productId] as const,
};

// Hook to fetch tags with optional filters
export function useTags(filters: TagFilters = {}) {
  return useQuery({
    queryKey: tagKeys.list(filters),
    queryFn: async () => {
      const result = await fetchTags(filters);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to fetch a single tag
export function useTag(tagId: string | undefined) {
  return useQuery({
    queryKey: tagKeys.detail(tagId || ''),
    queryFn: async () => {
      if (!tagId) throw new Error('Tag ID required');
      const result = await fetchTagById(tagId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!tagId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to fetch tag by slug
export function useTagBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: tagKeys.bySlug(slug || ''),
    queryFn: async () => {
      if (!slug) return null;
      const result = await fetchTagBySlug(slug);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to fetch featured tags
export function useFeaturedTags(categoryId?: string) {
  return useQuery({
    queryKey: tagKeys.featured(categoryId),
    queryFn: async () => {
      const result = await fetchFeaturedTags(categoryId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to fetch tags for a product
export function useProductTags(productId: string | undefined) {
  return useQuery({
    queryKey: tagKeys.product(productId || ''),
    queryFn: async () => {
      if (!productId) return [];
      const result = await fetchProductTags(productId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2,
  });
}

// Mutation hook to create a tag
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTagInput) => {
      const result = await createTag(input);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

// Mutation hook to update a tag
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tagId, updates }: { tagId: string; updates: UpdateTagInput }) => {
      const result = await updateTag(tagId, updates);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { tagId }) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(tagId) });
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

// Mutation hook to delete a tag
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const result = await deleteTag(tagId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

// Mutation hook to link a tag to product
export function useLinkTagToProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, tagId }: { productId: string; tagId: string }) => {
      const result = await linkTagToProduct(productId, tagId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.product(productId) });
    },
  });
}

// Mutation hook to unlink a tag from product
export function useUnlinkTagFromProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, tagId }: { productId: string; tagId: string }) => {
      const result = await unlinkTagFromProduct(productId, tagId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.product(productId) });
    },
  });
}

// Mutation hook to bulk update product tags
export function useUpdateProductTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, tagIds }: { productId: string; tagIds: string[] }) => {
      const result = await bulkUpdateProductTags(productId, tagIds);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.product(productId) });
    },
  });
}
