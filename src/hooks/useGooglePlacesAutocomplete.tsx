import { useState, useCallback, useEffect, useRef } from 'react';

interface AddressComponents {
  streetNumber?: string;
  route?: string;
  locality?: string; // City
  administrativeAreaLevel1?: string; // State/Province
  postalCode?: string;
  country?: string;
}

interface ParsedAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const useGooglePlacesAutocomplete = (onAddressSelect?: (address: ParsedAddress) => void) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          clearInterval(checkGoogleMaps);
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  const parseAddressComponents = useCallback(
    (components: google.maps.places.PlaceResult['address_components']): ParsedAddress => {
      const addressComponents: AddressComponents = {};

      if (!components) {
        return {
          addressLine1: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        };
      }

      components.forEach((component) => {
        const types = component.types;
        if (types.includes('street_number')) {
          addressComponents.streetNumber = component.long_name;
        } else if (types.includes('route')) {
          addressComponents.route = component.long_name;
        } else if (types.includes('locality')) {
          addressComponents.locality = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          addressComponents.administrativeAreaLevel1 = component.short_name;
        } else if (types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        } else if (types.includes('country')) {
          addressComponents.country = component.short_name;
        }
      });

      // Build address line 1
      const streetNumber = addressComponents.streetNumber || '';
      const route = addressComponents.route || '';
      const addressLine1 = [streetNumber, route].filter(Boolean).join(' ').trim() || '';

      return {
        addressLine1,
        city: addressComponents.locality || '',
        state: addressComponents.administrativeAreaLevel1 || '',
        postalCode: addressComponents.postalCode || '',
        country: addressComponents.country || '',
      };
    },
    [],
  );

  // Initialize autocomplete when Google Maps is loaded and input ref is available
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address'],
    });

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      if (place.address_components && onAddressSelect) {
        const parsed = parseAddressComponents(place.address_components);
        onAddressSelect(parsed);
      }
    });

    setAutocomplete(autocompleteInstance);

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, [isLoaded, onAddressSelect, parseAddressComponents]);

  return {
    inputRef,
    isLoaded,
    autocomplete,
  };
};
