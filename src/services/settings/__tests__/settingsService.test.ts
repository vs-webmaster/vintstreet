import { describe, it, expect } from 'vitest';
import {
  fetchBuyerProtectionFees,
  calculateBuyerProtectionFee,
  fetchCurrencyRates,
  fetchSellerFees,
  calculateSellerFee,
  getSellerFeePercentage,
  fetchNoProductsSettings,
  fetchPromoMessage,
} from '../settingsService';
import type { BuyerProtectionFee, SellerFee } from '../settingsService';
import { isSuccess } from '@/types/api';

describe('Settings Service', () => {
  describe('fetchBuyerProtectionFees', () => {
    it('should fetch buyer protection fees from real server', async () => {
      const result = await fetchBuyerProtectionFees();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('calculateBuyerProtectionFee', () => {
    it('should calculate fee for a price within tier', () => {
      const fees: BuyerProtectionFee[] = [
        {
          id: 'fee-1',
          min_price: 0,
          max_price: 100,
          percentage: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const fee = calculateBuyerProtectionFee(50, fees);
      expect(fee).toBe(2.5);
    });

    it('should return null if no matching tier', () => {
      const fees: BuyerProtectionFee[] = [
        {
          id: 'fee-1',
          min_price: 0,
          max_price: 100,
          percentage: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const fee = calculateBuyerProtectionFee(200, fees);
      expect(fee).toBeNull();
    });
  });

  describe('fetchCurrencyRates', () => {
    it('should fetch currency rates from real server', async () => {
      const result = await fetchCurrencyRates();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(typeof result.data).toBe('object');
        expect(result.data.GBP).toBeDefined();
      }
    });
  });

  describe('fetchSellerFees', () => {
    it('should fetch seller fees from real server', async () => {
      const result = await fetchSellerFees();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('calculateSellerFee', () => {
    it('should calculate seller fee for marketplace product', () => {
      const fees: SellerFee[] = [
        {
          id: 'fee-1',
          fee_type: 'marketplace',
          percentage: 10,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const fee = calculateSellerFee(100, fees, 'marketplace');
      expect(fee).toBe(10);
    });
  });

  describe('getSellerFeePercentage', () => {
    it('should return fee percentage', () => {
      const fees: SellerFee[] = [
        {
          id: 'fee-1',
          fee_type: 'marketplace',
          percentage: 10,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const percentage = getSellerFeePercentage(fees, 'marketplace');
      expect(percentage).toBe(10);
    });
  });

  describe('fetchNoProductsSettings', () => {
    it('should fetch no products settings from real server', async () => {
      const result = await fetchNoProductsSettings();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data === null || typeof result.data === 'object').toBe(true);
      }
    });
  });

  describe('fetchPromoMessage', () => {
    it('should fetch promo message from real server', async () => {
      const result = await fetchPromoMessage();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data === null || typeof result.data === 'string').toBe(true);
      }
    });
  });
});
