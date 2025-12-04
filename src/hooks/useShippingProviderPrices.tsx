import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchShippingProviderPrices,
  getProviderBandForWeight as getProviderBand,
  type ProviderPriceRow,
} from '@/services/shipping';
import { isFailure } from '@/types/api';

export const useShippingProviderPrices = () => {
  const { data: providerPrices = [], ...queryResult } = useQuery<ProviderPriceRow[]>({
    queryKey: ['shipping-provider-prices'],
    queryFn: async () => {
      const result = await fetchShippingProviderPrices();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getProviderBandForWeight = useCallback(
    (providerId: string | null, totalWeightKg: number): ProviderPriceRow | null => {
      if (!providerId || providerPrices.length === 0) return null;
      return getProviderBand(providerPrices, providerId, totalWeightKg);
    },
    [providerPrices],
  );

  return {
    providerPrices,
    getProviderBandForWeight,
    ...queryResult,
  };
};
