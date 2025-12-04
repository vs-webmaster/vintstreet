// Brand Query Hooks
// React Query hooks for brand data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBrands,
  fetchBrandById,
  fetchBrandByName,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandActive,
  toggleBrandPopular,
  bulkCreateBrands,
  type BrandFilters,
  type CreateBrandInput,
  type UpdateBrandInput,
} from '@/services/brands';
import { isSuccess } from '@/types/api';

// Query key factory for brands
export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (filters: BrandFilters) => [...brandKeys.lists(), filters] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string) => [...brandKeys.details(), id] as const,
  byName: (name: string) => [...brandKeys.all, 'name', name] as const,
};

// Hook to fetch brands with optional filters
export function useBrands(filters: BrandFilters = {}) {
  return useQuery({
    queryKey: brandKeys.list(filters),
    queryFn: async () => {
      const result = await fetchBrands(filters);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to fetch a single brand
export function useBrand(brandId: string | undefined) {
  return useQuery({
    queryKey: brandKeys.detail(brandId || ''),
    queryFn: async () => {
      if (!brandId) throw new Error('Brand ID required');
      const result = await fetchBrandById(brandId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to fetch brand by name
export function useBrandByName(name: string | undefined) {
  return useQuery({
    queryKey: brandKeys.byName(name || ''),
    queryFn: async () => {
      if (!name) return null;
      const result = await fetchBrandByName(name);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!name,
    staleTime: 1000 * 60 * 5,
  });
}

// Mutation hook to create a brand
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBrandInput) => {
      const result = await createBrand(input);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}

// Mutation hook to update a brand
export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ brandId, updates }: { brandId: string; updates: UpdateBrandInput }) => {
      const result = await updateBrand(brandId, updates);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) });
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
}

// Mutation hook to delete a brand
export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      const result = await deleteBrand(brandId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}

// Mutation hook to toggle brand active status
export function useToggleBrandActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      const result = await toggleBrandActive(brandId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, brandId) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) });
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
}

// Mutation hook to toggle brand popular status
export function useToggleBrandPopular() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      const result = await toggleBrandPopular(brandId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, brandId) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId) });
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
}

// Mutation hook to bulk create brands
export function useBulkCreateBrands() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brands: CreateBrandInput[]) => {
      const result = await bulkCreateBrands(brands);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}
