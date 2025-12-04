import { useState, useCallback } from 'react';
import { fetchProductForConflictCheck, fetchProductTimestamp, updateProductWithLock } from '@/services/products';
import { isFailure, type ApiError } from '@/types/api';

interface OptimisticLockState {
  originalUpdatedAt: string | null;
  hasConflict: boolean;
  conflictData: any | null;
}

export const useOptimisticLocking = () => {
  const [lockState, setLockState] = useState<OptimisticLockState>({
    originalUpdatedAt: null,
    hasConflict: false,
    conflictData: null,
  });

  // Store the original updated_at when loading a product
  const setOriginalTimestamp = useCallback((updatedAt: string | null) => {
    setLockState((prev) => ({
      ...prev,
      originalUpdatedAt: updatedAt,
      hasConflict: false,
      conflictData: null,
    }));
  }, []);

  // Check if product was modified by someone else
  const checkForConflict = useCallback(
    async (productId: string): Promise<{ hasConflict: boolean; currentData: any | null }> => {
      if (!lockState.originalUpdatedAt) {
        return { hasConflict: false, currentData: null };
      }

      const result = await fetchProductForConflictCheck(productId);

      if (isFailure(result)) {
        console.error('[OptimisticLocking] Error checking for conflict:', result.error);
        return { hasConflict: false, currentData: null };
      }

      const data = result.data;
      if (!data) {
        return { hasConflict: false, currentData: null };
      }

      const hasConflict = data.updated_at !== lockState.originalUpdatedAt;

      if (hasConflict) {
        setLockState((prev) => ({
          ...prev,
          hasConflict: true,
          conflictData: data,
        }));
      }

      return { hasConflict, currentData: data };
    },
    [lockState.originalUpdatedAt],
  );

  // Update with optimistic locking - returns true if successful
  const updateWithLock = useCallback(
    async (
      productId: string,
      updateData: any,
      options?: { forceOverwrite?: boolean },
    ): Promise<{ success: boolean; error?: string; conflictData?: any }> => {
      // If force overwrite, skip the conflict check
      if (!options?.forceOverwrite && lockState.originalUpdatedAt) {
        const { hasConflict, currentData } = await checkForConflict(productId);

        if (hasConflict) {
          return {
            success: false,
            error: 'CONFLICT',
            conflictData: currentData,
          };
        }
      }

      // Perform the update with conditional check
      const result = await updateProductWithLock(productId, updateData, lockState.originalUpdatedAt, options);

      if (isFailure(result)) {
        const apiError = result.error as ApiError;
        return {
          success: false,
          error: apiError?.message || 'Update failed',
        };
      }

      // Check if the result contains conflict data (conflict is returned as success with conflictData)
      if (result.data?.conflictData) {
        setLockState((prev) => ({
          ...prev,
          hasConflict: true,
          conflictData: result.data.conflictData,
        }));

        return {
          success: false,
          error: 'CONFLICT',
          conflictData: result.data.conflictData,
        };
      }

      // Update the timestamp for subsequent saves
      if (result.data?.product) {
        setLockState((prev) => ({
          ...prev,
          originalUpdatedAt: result.data.product!.updated_at || new Date().toISOString(),
          hasConflict: false,
          conflictData: null,
        }));
      }

      return { success: true };
    },
    [lockState.originalUpdatedAt, checkForConflict],
  );

  // Reset conflict state
  const clearConflict = useCallback(() => {
    setLockState((prev) => ({
      ...prev,
      hasConflict: false,
      conflictData: null,
    }));
  }, []);

  // Refresh with latest data (after conflict)
  const refreshTimestamp = useCallback(async (productId: string) => {
    const result = await fetchProductTimestamp(productId);

    if (!isFailure(result) && result.data) {
      setLockState((prev) => ({
        ...prev,
        originalUpdatedAt: result.data!.updated_at,
        hasConflict: false,
        conflictData: null,
      }));
    }
  }, []);

  return {
    originalUpdatedAt: lockState.originalUpdatedAt,
    hasConflict: lockState.hasConflict,
    conflictData: lockState.conflictData,
    setOriginalTimestamp,
    checkForConflict,
    updateWithLock,
    clearConflict,
    refreshTimestamp,
  };
};
