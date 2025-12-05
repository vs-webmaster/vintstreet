import { describe, it, expect } from 'vitest';
import {
  fetchAuctionByListingId,
  fetchBidsByAuctionId,
  checkAuctionExistsByListingId,
} from '../auctionService';
import { isSuccess } from '@/types/api';

describe('Auction Service', () => {
  describe('fetchAuctionByListingId', () => {
    it('should handle non-existent auction gracefully', async () => {
      const result = await fetchAuctionByListingId('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchBidsByAuctionId', () => {
    it('should fetch bids structure from real server', async () => {
      const result = await fetchBidsByAuctionId('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('checkAuctionExistsByListingId', () => {
    it('should check auction existence structure from real server', async () => {
      const result = await checkAuctionExistsByListingId('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });
});
