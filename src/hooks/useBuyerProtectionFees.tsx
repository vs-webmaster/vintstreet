import { useQuery } from '@tanstack/react-query';
import {
  fetchBuyerProtectionFees,
  calculateBuyerProtectionFee as calculateFee,
  type BuyerProtectionFee,
} from '@/services/settings';
import { isFailure } from '@/types/api';

export const useBuyerProtectionFees = () => {
  return useQuery({
    queryKey: ['buyer-protection-fees'],
    queryFn: async () => {
      const result = await fetchBuyerProtectionFees();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const calculateBuyerProtectionFee = (price: number, fees: BuyerProtectionFee[] | undefined): number | null => {
  if (!fees || fees.length === 0) return null;
  return calculateFee(price, fees);
};
