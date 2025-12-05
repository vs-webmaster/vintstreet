import { describe, it, expect } from 'vitest';
import {
  fetchNotifications,
  fetchUnreadNotifications,
} from '../notificationService';
import { isSuccess } from '@/types/api';

describe('Notification Service', () => {
  describe('fetchNotifications', () => {
    it('should fetch notifications from real server', async () => {
      const result = await fetchNotifications('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchUnreadNotifications', () => {
    it('should fetch unread notifications from real server', async () => {
      const result = await fetchUnreadNotifications('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
