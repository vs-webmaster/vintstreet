import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractSellerIds, getSellerDisplayName, fetchSellerInfoMap } from '../sellerNameUtils';
import type { SellerInfo } from '../sellerNameUtils';

vi.mock('@/services/users/userService', () => ({
  fetchSellerInfoMap: vi.fn(),
}));

describe('Seller Name Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractSellerIds', () => {
    it('should extract unique seller IDs from products', () => {
      const products = [
        { id: '1', seller_id: 'seller-1', name: 'Product 1' },
        { id: '2', seller_id: 'seller-1', name: 'Product 2' },
        { id: '3', seller_id: 'seller-2', name: 'Product 3' },
      ];

      const result = extractSellerIds(products);

      expect(result).toEqual(['seller-1', 'seller-2']);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty products', () => {
      const result = extractSellerIds([]);
      expect(result).toEqual([]);
    });

    it('should handle single product', () => {
      const products = [{ id: '1', seller_id: 'seller-1', name: 'Product 1' }];
      const result = extractSellerIds(products);
      expect(result).toEqual(['seller-1']);
    });
  });

  describe('getSellerDisplayName', () => {
    it('should return shop name when display format is shop_name', () => {
      const sellerProfile = {
        shop_name: 'Test Shop',
        display_name_format: 'shop_name',
      };

      const result = getSellerDisplayName(sellerProfile);
      expect(result).toBe('Test Shop');
    });

    it('should return personal name when display format is personal_name', () => {
      const sellerProfile = {
        display_name_format: 'personal_name',
        profile: {
          full_name: 'John Doe',
          username: 'johndoe',
        },
      };

      const result = getSellerDisplayName(sellerProfile);
      expect(result).toBe('John D.');
    });

    it('should return first name + initial for full name with multiple words', () => {
      const sellerProfile = {
        display_name_format: 'personal_name',
        profile: {
          full_name: 'John Michael Doe',
          username: 'johndoe',
        },
      };

      const result = getSellerDisplayName(sellerProfile);
      expect(result).toBe('John D.');
    });

    it('should return full name if only one word', () => {
      const sellerProfile = {
        display_name_format: 'personal_name',
        profile: {
          full_name: 'John',
          username: 'johndoe',
        },
      };

      const result = getSellerDisplayName(sellerProfile);
      expect(result).toBe('John');
    });

    it('should fallback to username if full name not available', () => {
      const sellerProfile = {
        display_name_format: 'personal_name',
        profile: {
          username: 'johndoe',
        },
      };

      const result = getSellerDisplayName(sellerProfile);
      expect(result).toBe('johndoe');
    });

    it('should fallback to business name if shop name not available', () => {
      const sellerProfile = {
        business_name: 'Business Name',
        display_name_format: 'shop_name',
      };

      const result = getSellerDisplayName(sellerProfile);
      expect(result).toBe('Business Name');
    });

    it('should return "Unknown Shop" if no name available', () => {
      const sellerProfile = {
        display_name_format: 'shop_name',
      };

      const result = getSellerDisplayName(sellerProfile);
      expect(result).toBe('Unknown Shop');
    });
  });

  describe('fetchSellerInfoMap', () => {
    it('should return empty map for empty seller IDs', async () => {
      const result = await fetchSellerInfoMap([]);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should fetch seller info map', async () => {
      const { fetchSellerInfoMap: fetchSellerInfoMapService } = await import('@/services/users/userService');
      
      const mockMap = new Map<string, SellerInfo>([
        [
          'seller-1',
          {
            user_id: 'seller-1',
            shop_name: 'Test Shop',
            display_name_format: 'shop_name',
          },
        ],
      ]);

      vi.mocked(fetchSellerInfoMapService).mockResolvedValue({
        success: true,
        data: mockMap,
      });

      const result = await fetchSellerInfoMap(['seller-1']);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(1);
    });
  });
});
