import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withErrorHandling, withMaybeNull, withMutation } from '../apiClient';
import type { PostgrestError } from '@supabase/supabase-js';
import { isSuccess, isFailure } from '@/types/api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withErrorHandling', () => {
    it('should return success when query succeeds', async () => {
      const mockData = { id: '123', name: 'Test' };
      const queryFn = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await withErrorHandling(queryFn, 'test-context');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(mockData);
      }
      expect(queryFn).toHaveBeenCalled();
    });

    it('should return failure when query returns error', async () => {
      const mockError: PostgrestError = {
        name: 'PostgrestError',
        message: 'Database error',
        details: 'Test error',
        hint: null as unknown as string,
        code: 'PGRST_ERROR',
      };

      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await withErrorHandling(queryFn, 'test-context');

      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toBeDefined();
      }
    });

    it('should return failure when data is null', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await withErrorHandling(queryFn, 'test-context');

      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error?.code).toBe('NO_DATA');
      }
    });

    it('should handle exceptions thrown by query function', async () => {
      const queryFn = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      const result = await withErrorHandling(queryFn, 'test-context');

      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('withMaybeNull', () => {
    it('should return success with data when query succeeds', async () => {
      const mockData = { id: '123', name: 'Test' };
      const queryFn = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await withMaybeNull(queryFn, 'test-context');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(mockData);
      }
    });

    it('should return success with null when data is null', async () => {
      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await withMaybeNull(queryFn, 'test-context');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeNull();
      }
    });

    it('should return failure when query returns error', async () => {
      const mockError: PostgrestError = {
        name: 'PostgrestError',
        message: 'Database error',
        details: 'Test error',
        hint: null as unknown as string,
        code: 'PGRST_ERROR',
      };

      const queryFn = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await withMaybeNull(queryFn, 'test-context');

      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('withMutation', () => {
    it('should return success when mutation succeeds', async () => {
      const mockData = { id: '123', name: 'Test' };
      const mutationFn = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await withMutation(mutationFn, 'test-context');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(mockData);
      }
    });

    it('should return success with null when mutation returns null', async () => {
      const mutationFn = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await withMutation(mutationFn, 'test-context');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBeNull();
      }
    });

    it('should return failure when mutation returns error', async () => {
      const mockError: PostgrestError = {
        name: 'PostgrestError',
        message: 'Insert failed',
        details: 'Test error',
        hint: null as unknown as string,
        code: 'PGRST_ERROR',
      };

      const mutationFn = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await withMutation(mutationFn, 'test-context');

      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle exceptions thrown by mutation function', async () => {
      const mutationFn = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      const result = await withMutation(mutationFn, 'test-context');

      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
