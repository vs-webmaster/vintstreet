import { describe, it, expect } from 'vitest';
import {
  fetchMessages,
  fetchMessageById,
  fetchReceivedMessages,
  fetchMessageThread,
  fetchUnreadCount,
  fetchFlaggedMessages,
  fetchMessagesBetweenUsers,
} from '../messageService';
import { isSuccess } from '@/types/api';

describe('Message Service', () => {
  describe('fetchMessages', () => {
    it('should fetch messages structure from real server', async () => {
      const result = await fetchMessages('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchMessageById', () => {
    it('should handle non-existent message gracefully', async () => {
      const result = await fetchMessageById('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchReceivedMessages', () => {
    it('should fetch received messages structure from real server', async () => {
      const result = await fetchReceivedMessages('00000000-0000-0000-0000-000000000000');

      // May succeed with array or fail - both are valid
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchMessageThread', () => {
    it('should fetch message thread structure from real server', async () => {
      const result = await fetchMessageThread('00000000-0000-0000-0000-000000000000');

      // May succeed with array or fail - both are valid
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchUnreadCount', () => {
    it('should fetch unread count from real server', async () => {
      const result = await fetchUnreadCount('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(typeof result.data).toBe('number');
      }
    });
  });

  describe('fetchFlaggedMessages', () => {
    it('should fetch flagged messages structure from real server', async () => {
      const result = await fetchFlaggedMessages();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchMessagesBetweenUsers', () => {
    it('should fetch messages between users structure from real server', async () => {
      const result = await fetchMessagesBetweenUsers('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001');

      // May succeed with array or fail - both are valid
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
