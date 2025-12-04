import { fetchSellerInfoMap as fetchSellerInfoMapService } from '@/services/users/userService';

export interface SellerInfo {
  user_id: string;
  shop_name: string;
  business_name?: string;
  shop_logo_url?: string;
  display_name_format?: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

/**
 * Fetch seller info for a list of products and return a map by user_id.
 * @deprecated Use fetchSellerInfoMapService from @/services/users/userService instead
 */
export const fetchSellerInfoMap = async (sellerIds: string[]): Promise<Map<string, SellerInfo>> => {
  if (sellerIds.length === 0) return new Map();

  const result = await fetchSellerInfoMapService(sellerIds);
  if (result.success && result.data) {
    return result.data as Map<string, SellerInfo>;
  }
  return new Map();
};

/**
 * Extract unique seller IDs from products.
 */
export const extractSellerIds = <T extends { seller_id: string }>(products: T[]): string[] => {
  return [...new Set(products.map((p) => p.seller_id))];
};

/**
 * Get the display name for a seller based on their preferences
 */
export const getSellerDisplayName = (sellerProfile: unknown): string => {
  const displayFormat = sellerProfile?.display_name_format || 'shop_name';

  if (displayFormat === 'personal_name') {
    // Get name from user profile
    const profile = sellerProfile?.profile || sellerProfile?.profiles;
    const fullName = profile?.full_name;

    if (fullName) {
      const nameParts = fullName.trim().split(' ');
      if (nameParts.length >= 2) {
        // First name + surname initial
        const firstName = nameParts[0];
        const surnameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        return `${firstName} ${surnameInitial}.`;
      }
      // If only one name, return it as is
      return fullName;
    }

    // Fallback to username
    return profile?.username || 'Seller';
  }

  // Default to shop name
  return sellerProfile?.shop_name || sellerProfile?.business_name || 'Unknown Shop';
};
