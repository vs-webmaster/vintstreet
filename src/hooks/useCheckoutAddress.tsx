// Checkout Address Hook
// Handles saved addresses and shipping details

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchBuyerProfile,
  fetchSavedAddresses,
  createSavedAddress,
  updateBuyerProfileShipping,
  type SavedAddress,
} from '@/services/users/userService';
import { isFailure } from '@/types/api';

export interface ShippingDetails {
  email: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface UseCheckoutAddressProps {
  userId?: string;
  userEmail?: string;
  profileFullName?: string;
}

export const useCheckoutAddress = ({ userId, userEmail, profileFullName }: UseCheckoutAddressProps) => {
  const [useExistingAddress, setUseExistingAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [manualAddressMode, setManualAddressMode] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);

  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    email: '',
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: localStorage.getItem('shipping_country') || 'GB',
    phone: '',
  });

  // Fetch buyer profile
  const { data: buyerProfile } = useQuery({
    queryKey: ['buyer-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const result = await fetchBuyerProfile(userId);
      if (isFailure(result)) {
        if (result.error.message?.includes('not found')) return null;
        throw result.error;
      }
      return result.data;
    },
    enabled: !!userId,
  });

  // Fetch saved addresses
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['saved-addresses', userId],
    queryFn: async () => {
      if (!userId) return [];
      const result = await fetchSavedAddresses(userId);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!userId,
  });

  // Pre-fill shipping details from saved profile or default address
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      const defaultAddress = savedAddresses.find((addr) => addr.is_default) || savedAddresses[0];
      setSelectedAddressId(defaultAddress.id);
      setUseExistingAddress(true);
    } else if (buyerProfile) {
      setShippingDetails({
        email: userEmail || '',
        firstName: buyerProfile.shipping_first_name || '',
        lastName: buyerProfile.shipping_last_name || '',
        addressLine1: buyerProfile.shipping_address_line1 || '',
        addressLine2: buyerProfile.shipping_address_line2 || '',
        city: buyerProfile.shipping_city || '',
        state: buyerProfile.shipping_state || '',
        postalCode: buyerProfile.shipping_postal_code || '',
        country: buyerProfile.shipping_country || localStorage.getItem('shipping_country') || 'GB',
        phone: buyerProfile.shipping_phone || '',
      });
      setUseExistingAddress(false);
    }
  }, [buyerProfile, savedAddresses, userEmail]);

  // Pre-populate first name and last name from user profile
  useEffect(() => {
    if (profileFullName && !shippingDetails.firstName && !shippingDetails.lastName) {
      const nameParts = profileFullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setShippingDetails((prev) => ({
        ...prev,
        firstName,
        lastName,
      }));
    }
  }, [profileFullName, shippingDetails.firstName, shippingDetails.lastName]);

  // Get final shipping details (from selected address or form)
  const getFinalShippingDetails = (): ShippingDetails => {
    if (useExistingAddress && selectedAddressId) {
      const selectedAddress = savedAddresses.find((addr) => addr.id === selectedAddressId);
      if (selectedAddress) {
        return {
          email: userEmail || '',
          firstName: selectedAddress.first_name,
          lastName: selectedAddress.last_name,
          addressLine1: selectedAddress.address_line1,
          addressLine2: selectedAddress.address_line2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postal_code,
          country: selectedAddress.country,
          phone: selectedAddress.phone,
        };
      }
    }
    return shippingDetails;
  };

  // Validate shipping details
  const validateShippingDetails = (): boolean => {
    const details = getFinalShippingDetails();
    return !!(details.firstName && details.lastName && details.addressLine1 && details.city && details.country);
  };

  // Save address to database
  const saveShippingAddress = async (userId: string) => {
    const details = shippingDetails;

    // Update buyer profile
    await updateBuyerProfileShipping(userId, {
      shipping_first_name: details.firstName,
      shipping_last_name: details.lastName,
      shipping_address_line1: details.addressLine1,
      shipping_address_line2: details.addressLine2,
      shipping_city: details.city,
      shipping_state: details.state,
      shipping_postal_code: details.postalCode,
      shipping_country: details.country,
      shipping_phone: details.phone,
    });

    // Save to saved_addresses if user opted to save
    if (saveAddress) {
      await createSavedAddress({
        user_id: userId,
        first_name: details.firstName,
        last_name: details.lastName,
        address_line1: details.addressLine1,
        address_line2: details.addressLine2 || null,
        city: details.city,
        state: details.state,
        postal_code: details.postalCode,
        country: details.country,
        phone: details.phone,
        is_default: savedAddresses.length === 0,
      });
    }
  };

  return {
    shippingDetails,
    setShippingDetails,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    useExistingAddress,
    setUseExistingAddress,
    manualAddressMode,
    setManualAddressMode,
    addressSelected,
    setAddressSelected,
    saveAddress,
    setSaveAddress,
    getFinalShippingDetails,
    validateShippingDetails,
    saveShippingAddress,
  };
};
