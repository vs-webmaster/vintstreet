// Hook for resolving seller shop names to user IDs
// Handles backwards compatibility for cart items that store shop_name instead of user_id

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSellerProfilesByShopNames } from '@/services/users';
import { isFailure } from '@/types/api';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Hook to resolve seller shop names to user IDs for backwards compatibility.
 * Some cart items may store shop_name instead of user_id as seller_id.
 */
export const useSellerNameMappings = (rawSellerIds: (string | undefined)[]) => {
  // Filter out UUIDs - we only need to look up shop names
  const sellerNames = useMemo(
    () => rawSellerIds.filter((id): id is string => !!id && !UUID_REGEX.test(id)),
    [rawSellerIds],
  );

  const { data: nameMappings = [] } = useQuery({
    queryKey: ['seller-name-mappings', sellerNames],
    queryFn: async () => {
      if (sellerNames.length === 0) return [];
      const result = await fetchSellerProfilesByShopNames(sellerNames);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: sellerNames.length > 0,
  });

  // Resolve raw IDs to valid UUIDs
  const resolvedSellerIds = useMemo(
    () =>
      rawSellerIds
        .map((id) => {
          if (!id) return '';
          if (UUID_REGEX.test(id)) return id;
          return nameMappings.find((m) => m.shop_name === id)?.user_id || '';
        })
        .filter((id): id is string => UUID_REGEX.test(id)),
    [rawSellerIds, nameMappings],
  );

  return {
    nameMappings,
    resolvedSellerIds,
    isUuid: (id: string | undefined) => !!id && UUID_REGEX.test(id),
  };
};
