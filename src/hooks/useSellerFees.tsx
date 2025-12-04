import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSellerFees,
  updateSellerFee,
  calculateSellerFee as calculateFee,
  getSellerFeePercentage as getFeePercentage,
  type SellerFee,
} from '@/services/settings';
import { isFailure } from '@/types/api';

export const useSellerFees = () => {
  return useQuery({
    queryKey: ['seller-fees'],
    queryFn: async () => {
      const result = await fetchSellerFees();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateSellerFee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feeType, percentage }: { feeType: 'marketplace' | 'auction'; percentage: number }) => {
      const result = await updateSellerFee(feeType, percentage);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-fees'] });
    },
  });
};

export const calculateSellerFee = (
  price: number,
  fees: SellerFee[] | undefined,
  productType: 'marketplace' | 'auction',
): number | null => {
  if (!fees || fees.length === 0) return null;
  return calculateFee(price, fees, productType);
};

export const getSellerFeePercentage = (
  fees: SellerFee[] | undefined,
  productType: 'marketplace' | 'auction',
): number | null => {
  if (!fees || fees.length === 0) return null;
  return getFeePercentage(fees, productType);
};
