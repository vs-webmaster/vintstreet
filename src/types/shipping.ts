// Centralized Shipping Types
// All shipping-related type definitions in one place

export interface ShippingProvider {
  id: string;
  name: string;
  carrier?: string | null;
  is_active: boolean;
  is_international?: boolean | null;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  tracking_url_template?: string | null;
  logo_url?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingWeightBand {
  id: string;
  provider_id: string;
  band_name: string;
  min_weight_kg: number;
  max_weight_kg: number;
  price: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  estimatedDays: string;
  carrier?: string;
  isInternational?: boolean;
  providerId?: string;
}

export interface ShippingLabel {
  id: string;
  order_id: string;
  provider_id?: string | null;
  tracking_number?: string | null;
  label_url?: string | null;
  carrier?: string | null;
  service_type?: string | null;
  weight_kg?: number | null;
  dimensions?: ShippingDimensions | null;
  status: ShippingLabelStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export type ShippingLabelStatus = 
  | 'pending'
  | 'created'
  | 'failed'
  | 'voided';

export interface ShippingDimensions {
  width: number;
  height: number;
  length: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface ShippingCalculationInput {
  weight: number;
  dimensions?: ShippingDimensions;
  destinationCountry: string;
  destinationPostalCode?: string;
  isUkRegional?: 'scotland' | 'northern_ireland' | 'isle_of_man' | null;
}

export interface ShippingCalculationResult {
  options: ShippingOption[];
  selectedOption?: ShippingOption;
  totalWeight: number;
}

// Type guards
export const isShippingProvider = (obj: unknown): obj is ShippingProvider => {
  if (!obj || typeof obj !== 'object') return false;
  const sp = obj as Record<string, unknown>;
  return (
    typeof sp.id === 'string' &&
    typeof sp.name === 'string' &&
    typeof sp.is_active === 'boolean'
  );
};

export const isShippingOption = (obj: unknown): obj is ShippingOption => {
  if (!obj || typeof obj !== 'object') return false;
  const so = obj as Record<string, unknown>;
  return (
    typeof so.id === 'string' &&
    typeof so.name === 'string' &&
    typeof so.price === 'number'
  );
};

// Calculate if shipping option applies to weight
export const isWeightInBand = (weight: number, band: ShippingWeightBand): boolean => {
  return weight >= band.min_weight_kg && weight <= band.max_weight_kg;
};

// Format estimated delivery days
export const formatEstimatedDelivery = (minDays?: number | null, maxDays?: number | null): string => {
  if (!minDays && !maxDays) return 'Varies';
  if (minDays && maxDays) {
    if (minDays === maxDays) return `${minDays} day${minDays === 1 ? '' : 's'}`;
    return `${minDays}-${maxDays} days`;
  }
  if (minDays) return `${minDays}+ days`;
  if (maxDays) return `Up to ${maxDays} days`;
  return 'Varies';
};
