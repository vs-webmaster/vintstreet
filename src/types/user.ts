// Centralized User Types
// All user-related type definitions in one place

export type UserType = 'buyer' | 'seller' | 'both';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  user_type: UserType;
  is_active?: boolean;
  is_blocked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  shop_name?: string | null;
  shop_description?: string | null;
  shop_logo_url?: string | null;
  shop_tagline?: string | null;
  display_name_format?: 'shop_name' | 'personal_name' | null;
  business_name?: string | null;
  business_license?: string | null;
  business_address?: string | null;
  business_city?: string | null;
  business_postal_code?: string | null;
  business_country?: string | null;
  return_address_line1?: string | null;
  return_address_line2?: string | null;
  return_city?: string | null;
  return_state?: string | null;
  return_postal_code?: string | null;
  return_country?: string | null;
  tax_id?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  return_policy?: string | null;
  shipping_policy?: string | null;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  setup_completed?: boolean | null;
  setup_step?: number | null;
  is_suspended?: boolean | null;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerProfile {
  id: string;
  user_id: string;
  // Shipping address
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_phone?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  // Billing address
  billing_first_name?: string | null;
  billing_last_name?: string | null;
  billing_phone?: string | null;
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  // Preferences
  preferred_payment_method?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  address_type: 'shipping' | 'billing';
  is_default?: boolean;
  first_name: string;
  last_name: string;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
}

// Combined user with profile data
export interface UserWithProfile {
  user: User;
  profile: Profile;
  sellerProfile?: SellerProfile | null;
  buyerProfile?: BuyerProfile | null;
}

// Type guards
export const isProfile = (obj: unknown): obj is Profile => {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.user_id === 'string';
};

export const isSellerProfile = (obj: unknown): obj is SellerProfile => {
  if (!obj || typeof obj !== 'object') return false;
  const sp = obj as Record<string, unknown>;
  return typeof sp.id === 'string' && typeof sp.user_id === 'string';
};

export const isSeller = (profile: Profile): boolean => {
  return profile.user_type === 'seller' || profile.user_type === 'both';
};

export const isBuyer = (profile: Profile): boolean => {
  return profile.user_type === 'buyer' || profile.user_type === 'both';
};
