// Users Query Hooks
// React Query hooks for user profile data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfile,
  fetchProfileByEmail,
  updateProfile,
  updateUserType,
  fetchSellerProfile,
  fetchSellerProfiles,
  checkSellerProfileExists,
  createSellerProfile,
  updateSellerProfile,
  fetchBuyerProfile,
  createBuyerProfile,
  updateBuyerProfile,
  fetchAllUsers,
  fetchUserStats,
  type UserFilters,
  type UpdateProfileInput,
  type CreateSellerProfileInput,
  type UpdateSellerProfileInput,
  type UpdateBuyerProfileInput,
} from '@/services/users';
import { isSuccess } from '@/types/api';
import type { UserType } from '@/types/user';

// Query key factory for users
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
  profileByEmail: (email: string) => [...userKeys.all, 'profile', 'email', email] as const,
  seller: (userId: string) => [...userKeys.all, 'seller', userId] as const,
  sellerBatch: (userIds: string[]) => [...userKeys.all, 'sellers', userIds] as const,
  sellerExists: (userId: string) => [...userKeys.all, 'sellerExists', userId] as const,
  buyer: (userId: string) => [...userKeys.all, 'buyer', userId] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
};

// ==================== PROFILE HOOKS ====================

// Hook to fetch user profile
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.profile(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      const result = await fetchProfile(userId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to fetch profile by email
export function useProfileByEmail(email: string | undefined) {
  return useQuery({
    queryKey: userKeys.profileByEmail(email || ''),
    queryFn: async () => {
      if (!email) return null;
      const result = await fetchProfileByEmail(email);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!email,
    staleTime: 1000 * 60 * 5,
  });
}

// Mutation hook to update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: UpdateProfileInput }) => {
      const result = await updateProfile(userId, updates);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
  });
}

// Mutation hook to update user type
export function useUpdateUserType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userType }: { userId: string; userType: UserType }) => {
      const result = await updateUserType(userId, userType);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
  });
}

// ==================== SELLER PROFILE HOOKS ====================

// Hook to fetch seller profile
export function useSellerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.seller(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      const result = await fetchSellerProfile(userId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to batch fetch seller profiles
export function useSellerProfiles(userIds: string[]) {
  return useQuery({
    queryKey: userKeys.sellerBatch(userIds),
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const result = await fetchSellerProfiles(userIds);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to check if seller profile exists
export function useSellerProfileExists(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.sellerExists(userId || ''),
    queryFn: async () => {
      if (!userId) return false;
      const result = await checkSellerProfileExists(userId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Mutation hook to create seller profile
export function useCreateSellerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSellerProfileInput) => {
      const result = await createSellerProfile(input);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { user_id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.seller(user_id) });
      queryClient.invalidateQueries({ queryKey: userKeys.sellerExists(user_id) });
    },
  });
}

// Mutation hook to update seller profile
export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: UpdateSellerProfileInput }) => {
      const result = await updateSellerProfile(userId, updates);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.seller(userId) });
    },
  });
}

// ==================== BUYER PROFILE HOOKS ====================

// Hook to fetch buyer profile
export function useBuyerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.buyer(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      const result = await fetchBuyerProfile(userId);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Mutation hook to create buyer profile
export function useCreateBuyerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, input }: { userId: string; input?: UpdateBuyerProfileInput }) => {
      const result = await createBuyerProfile(userId, input);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.buyer(userId) });
    },
  });
}

// Mutation hook to update buyer profile
export function useUpdateBuyerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: UpdateBuyerProfileInput }) => {
      const result = await updateBuyerProfile(userId, updates);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.buyer(userId) });
    },
  });
}

// ==================== ADMIN HOOKS ====================

// Hook to fetch all users with pagination
export function useUsers(filters: UserFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...userKeys.list(filters), page, pageSize],
    queryFn: async () => {
      const result = await fetchAllUsers(filters, page, pageSize);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Hook to fetch user stats
export function useUserStats() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: async () => {
      const result = await fetchUserStats();
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 5,
  });
}
