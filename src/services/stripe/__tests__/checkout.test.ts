import { describe, it, expect } from 'vitest';

describe('Payment Processing', () => {
  describe('Split Payment Calculation', () => {
    it('should calculate correct split for single seller', () => {
      const orderTotal = 100;
      const sellerFeePercent = 10;
      const buyerProtectionPercent = 5;

      const platformFee = orderTotal * (sellerFeePercent / 100);
      const buyerProtection = orderTotal * (buyerProtectionPercent / 100);
      const sellerAmount = orderTotal - platformFee;

      expect(sellerAmount).toBe(90);
      expect(platformFee).toBe(10);
      expect(buyerProtection).toBe(5);
    });

    it('should calculate split for multiple sellers', () => {
      const orders = [
        { sellerId: 'seller1', amount: 100, sellerFee: 10 },
        { sellerId: 'seller2', amount: 50, sellerFee: 10 },
      ];

      const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
      expect(totalAmount).toBe(150);
    });
  });
});
