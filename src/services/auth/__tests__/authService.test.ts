import { describe, it, expect } from 'vitest';
import { signOut } from '../authService';

describe('AuthService', () => {
  describe('signOut', () => {
    it('should handle sign out', async () => {
      const result = await signOut();
      expect(result).toHaveProperty('success');
    });
  });
});
