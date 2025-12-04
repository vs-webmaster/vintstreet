// Checkout Shipping Hook
// Handles shipping options, pricing, and weight calculations

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShippingProviderPrices } from '@/hooks/useShippingProviderPrices';
import { fetchShippingOptionsBySellers, type ShippingOptionRow } from '@/services/shipping';
import { isFailure } from '@/types/api';

interface CartItem {
  id: string;
  listing_id: string;
  listings?: {
    seller_id: string;
    weight?: number | null;
    discounted_price?: number | null;
    starting_price?: number;
    product_name?: string;
  };
}

interface UseCheckoutShippingProps {
  cartItems: CartItem[];
  sellerIds: string[];
  nameMappings: Array<{ user_id: string; shop_name: string }>;
  shippingCountry: string;
}

export const useCheckoutShipping = ({
  cartItems,
  sellerIds,
  nameMappings,
  shippingCountry,
}: UseCheckoutShippingProps) => {
  const [selectedShippingOptions, setSelectedShippingOptions] = useState<Record<string, string>>({});
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Fetch shipping options with provider names for all resolved seller IDs
  const { data: shippingOptionsData } = useQuery({
    queryKey: ['shipping-options', sellerIds],
    queryFn: async () => {
      if (sellerIds.length === 0) return [];

      const result = await fetchShippingOptionsBySellers(sellerIds);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: sellerIds.length > 0,
  });

  const { providerPrices, getProviderBandForWeight } = useShippingProviderPrices();

  // Group shipping options by seller
  const shippingOptionsBySeller = useMemo(() => {
    return (
      shippingOptionsData?.reduce(
        (acc, option) => {
          if (!acc[option.seller_id]) {
            acc[option.seller_id] = [];
          }
          acc[option.seller_id].push(option);
          return acc;
        },
        {} as Record<string, ShippingOptionRow[]>,
      ) || {}
    );
  }, [shippingOptionsData]);

  // Get items for a specific seller
  const getSellerItems = (sellerId: string) => {
    return cartItems.filter((item) => {
      if (uuidRegex.test(item.listings?.seller_id || '')) return item.listings?.seller_id === sellerId;
      const mapped = nameMappings?.find((m) => m.shop_name === item.listings?.seller_id)?.user_id;
      return mapped === sellerId;
    });
  };

  // Calculate total weight for a seller's items
  const getSellerWeight = (sellerId: string): number => {
    const sellerItems = getSellerItems(sellerId);
    return sellerItems.reduce((sum, item) => {
      const weight = item.listings?.weight ?? 0;
      return sum + (typeof weight === 'number' ? weight : 0);
    }, 0);
  };

  // Get valid shipping options for a seller (filtered by weight)
  const getValidOptions = (sellerId: string): ShippingOptionRow[] => {
    const options = shippingOptionsBySeller[sellerId] || [];
    const totalWeight = getSellerWeight(sellerId);
    const isUK = shippingCountry === 'GB';

    return options.filter((option) => {
      const providerBand = getProviderBandForWeight(option.provider_id, totalWeight);
      if (!providerBand || !providerBand.price || providerBand.price <= 0) return false;

      const providerName = option.shipping_providers?.name?.toLowerCase() || '';

      // Filter out International Royal Mail Tracked if UK is selected
      if (isUK && providerName.includes('international')) return false;

      // Show only international options for non-UK countries
      if (!isUK && !providerName.includes('international')) return false;

      return true;
    });
  };

  // Auto-select first valid shipping option for each seller
  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    sellerIds.forEach((sellerId) => {
      const validOptions = getValidOptions(sellerId);
      if (validOptions.length > 0 && !selectedShippingOptions[sellerId]) {
        initialSelections[sellerId] = validOptions[0].id;
      }
    });
    if (Object.keys(initialSelections).length > 0) {
      setSelectedShippingOptions((prev) => ({ ...prev, ...initialSelections }));
    }
  }, [shippingOptionsData, providerPrices, cartItems, shippingCountry]);

  // Calculate total shipping cost
  const shippingCost = useMemo(() => {
    return sellerIds.reduce((total, sellerId) => {
      const selectedOptionId = selectedShippingOptions[sellerId];
      if (!selectedOptionId) return total;

      const selectedOption = shippingOptionsData?.find((opt) => opt.id === selectedOptionId);
      if (!selectedOption) return total;

      const totalWeight = getSellerWeight(sellerId);
      const providerBand = getProviderBandForWeight(selectedOption.provider_id, totalWeight);
      const postagePrice = providerBand ? Number(providerBand.price) : 0;

      return total + postagePrice;
    }, 0);
  }, [sellerIds, selectedShippingOptions, shippingOptionsData, cartItems, providerPrices]);

  // Get price for a specific option
  const getOptionPrice = (option: ShippingOptionRow, sellerId: string): number => {
    const totalWeight = getSellerWeight(sellerId);
    const providerBand = getProviderBandForWeight(option.provider_id, totalWeight);
    return providerBand ? Number(providerBand.price) : 0;
  };

  return {
    selectedShippingOptions,
    setSelectedShippingOptions,
    shippingOptionsBySeller,
    shippingCost,
    getSellerItems,
    getSellerWeight,
    getValidOptions,
    getOptionPrice,
  };
};
