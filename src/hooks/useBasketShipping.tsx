// Basket Shipping Hook
// Handles seller groups, shipping options, and pricing for basket

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBuyerProtectionFees, calculateBuyerProtectionFee } from '@/hooks/useBuyerProtectionFees';
import { useSellerNameMappings } from '@/hooks/useSellerNameMappings';
import { useShippingProviderPrices } from '@/hooks/useShippingProviderPrices';
import { fetchShippingOptionsBySellers, type ProviderPriceRow } from '@/services/shipping';
import { fetchSellerInfoMap } from '@/services/users';
import { isFailure } from '@/types/api';

export interface SellerGroup {
  sellerId: string;
  sellerName: string;
  items: unknown[];
  selectedShipping: string | null;
}

interface CartItem {
  id: string;
  listing_id: string;
  listings?: {
    id?: string;
    seller_id: string;
    weight?: number | null;
    discounted_price?: number | null;
    starting_price?: number;
    product_name?: string;
    thumbnail?: string;
    status?: string;
  } | null;
}

export const useBasketShipping = (cartItems: CartItem[]) => {
  const [sellerGroups, setSellerGroups] = useState<Record<string, SellerGroup>>({});
  const [shippingCountry, setShippingCountry] = useState<string>(() => {
    return localStorage.getItem('shipping_country') || '';
  });
  const [ukRegion, setUkRegion] = useState<string>('none');
  const { data: buyerProtectionFees } = useBuyerProtectionFees();

  // Filter out items with null listings
  const validCartItems = useMemo(() => cartItems.filter((item) => item.listings !== null), [cartItems]);

  const rawSellerIds = useMemo(
    () => [...new Set(validCartItems.map((item) => item.listings?.seller_id).filter(Boolean))],
    [validCartItems],
  );

  // Use extracted hook for seller name mappings
  const { nameMappings, resolvedSellerIds: sellerIds, isUuid } = useSellerNameMappings(rawSellerIds);

  const { data: sellerProfiles } = useQuery({
    queryKey: ['seller-profiles-batch', sellerIds],
    queryFn: async () => {
      if (sellerIds.length === 0) return [];
      const result = await fetchSellerInfoMap(sellerIds);
      if (isFailure(result)) {
        throw result.error;
      }
      if (!result.data) {
        return [];
      }
      // Convert map to array format expected by the hook
      return Array.from(result.data.values()).map((seller) => ({
        user_id: seller.user_id,
        shop_name: seller.shop_name || '',
      }));
    },
    enabled: sellerIds.length > 0,
  });

  const { data: shippingOptions = [] } = useQuery({
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

  // Group cart items by seller
  useEffect(() => {
    if (validCartItems.length === 0) {
      setSellerGroups((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    if (!sellerProfiles && sellerIds.length > 0) return;

    setSellerGroups((prev) => {
      const groups: Record<string, SellerGroup> = {};

      validCartItems.forEach((item) => {
        const resolvedId = isUuid(item.listings?.seller_id)
          ? item.listings?.seller_id
          : nameMappings?.find((m) => m.shop_name === item.listings?.seller_id)?.user_id || item.listings?.seller_id;

        if (!resolvedId) return;

        if (!groups[resolvedId]) {
          const sellerProfile = sellerProfiles?.find((p) => p.user_id === resolvedId);
          const existingGroup = prev[resolvedId];
          groups[resolvedId] = {
            sellerId: resolvedId,
            sellerName: sellerProfile?.shop_name || 'Seller',
            items: [],
            selectedShipping: existingGroup?.selectedShipping || null,
          };
        }
        groups[resolvedId].items.push(item);
      });

      // Auto-select valid shipping option for each seller
      Object.keys(groups).forEach((sellerId) => {
        const sellerShippingOptions = shippingOptions.filter((opt) => opt.seller_id === sellerId);
        const group = groups[sellerId];
        if (!sellerShippingOptions.length || group.selectedShipping) return;

        const totalWeight = group.items.reduce((sum, item) => {
          const weight = item.listings?.weight ?? 0;
          return sum + (typeof weight === 'number' ? weight : 0);
        }, 0);

        const validOptions = sellerShippingOptions.filter((option) => {
          const rows = (providerPrices as ProviderPriceRow[]).filter((row) => {
            if (row.provider_id !== option.provider_id) return false;
            if (row.min_weight == null || row.max_weight == null) return false;
            return totalWeight >= row.min_weight && totalWeight <= row.max_weight;
          });
          return rows.some((row) => row.price && row.price > 0);
        });

        if (validOptions.length > 0) {
          group.selectedShipping = validOptions[0].id;
        }
      });

      return groups;
    });
  }, [validCartItems, sellerProfiles, shippingOptions, nameMappings, sellerIds.length, providerPrices, isUuid]);

  const handleShippingChange = (sellerId: string, shippingId: string) => {
    setSellerGroups((prev) => ({
      ...prev,
      [sellerId]: { ...prev[sellerId], selectedShipping: shippingId },
    }));
  };

  const handleCountryChange = (value: string) => {
    setShippingCountry(value);
    localStorage.setItem('shipping_country', value);
    setUkRegion('none');
  };

  // Calculate totals
  const subtotal = useMemo(
    () =>
      validCartItems.reduce(
        (sum, item) => sum + (item.listings?.discounted_price || item.listings?.starting_price || 0),
        0,
      ),
    [validCartItems],
  );

  // Calculate buyer protection fee for all items
  const totalBuyerProtectionFee = useMemo(() => {
    return validCartItems.reduce((sum, item) => {
      const itemPrice = item.listings?.discounted_price || item.listings?.starting_price || 0;
      const fee = calculateBuyerProtectionFee(itemPrice, buyerProtectionFees);
      return sum + (fee || 0);
    }, 0);
  }, [validCartItems, buyerProtectionFees]);

  const totalShipping = useMemo(() => {
    return Object.values(sellerGroups).reduce((sum, group) => {
      if (!group.selectedShipping) return sum;

      const selectedOption = shippingOptions.find((opt) => opt.id === group.selectedShipping);
      if (!selectedOption) return sum;

      const totalWeight = group.items.reduce((weightSum, item) => {
        const weight = item.listings?.weight ?? 0;
        return weightSum + (typeof weight === 'number' ? weight : 0);
      }, 0);

      const providerBand = getProviderBandForWeight(selectedOption.provider_id, totalWeight);
      return sum + (providerBand ? Number(providerBand.price) : 0);
    }, 0);
  }, [sellerGroups, shippingOptions, getProviderBandForWeight]);

  const total = subtotal + totalShipping + totalBuyerProtectionFee;

  const canCheckout = useMemo(
    () =>
      validCartItems.length > 0 &&
      validCartItems.every((item) => item.listings?.status === 'published') &&
      shippingCountry !== '' &&
      Object.values(sellerGroups).every((group) => group.selectedShipping),
    [validCartItems, shippingCountry, sellerGroups],
  );

  // Get filtered shipping options for a seller
  const getFilteredOptions = (sellerId: string) => {
    return shippingOptions.filter((opt) => {
      if (opt.seller_id !== sellerId) return false;

      const providerName = opt.shipping_providers?.name?.toLowerCase() || '';
      const isUK = shippingCountry === 'GB';

      if (isUK && providerName.includes('international')) return false;
      if (isUK && ukRegion !== 'none') {
        if (ukRegion === 'scottish' && !providerName.includes('scottish highlands')) return false;
        if (ukRegion === 'northern-ireland' && !providerName.includes('northern ireland')) return false;
        if (ukRegion === 'isle-of-man' && !providerName.includes('isle of man')) return false;
      }
      if (!isUK && !providerName.includes('international')) return false;

      return true;
    });
  };

  return {
    validCartItems,
    sellerGroups,
    shippingCountry,
    setShippingCountry,
    ukRegion,
    setUkRegion,
    shippingOptions,
    subtotal,
    totalShipping,
    totalBuyerProtectionFee,
    total,
    canCheckout,
    handleShippingChange,
    handleCountryChange,
    getProviderBandForWeight,
    getFilteredOptions,
  };
};
