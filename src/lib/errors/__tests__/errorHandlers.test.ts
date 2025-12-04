import { describe, it, expect } from 'vitest';
import {
  normalizeError,
  getUserMessage,
  fromPostgrestError,
} from '../errorHandlers';
import { AppError, DatabaseError, ValidationError } from '../errorTypes';

describe('Error Handlers', () => {
  describe('normalizeError', () => {
    it('should normalize AppError', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      const normalized = normalizeError(error);

      expect(normalized).toBeInstanceOf(AppError);
      expect(normalized.message).toBe('Test error');
      expect(normalized.code).toBe('TEST_ERROR');
      expect(normalized.statusCode).toBe(400);
    });

    it('should normalize standard Error', () => {
      const error = new Error('Standard error');
      const normalized = normalizeError(error);

      expect(normalized).toBeInstanceOf(AppError);
      expect(normalized.message).toBe('Standard error');
      expect(normalized.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle string errors', () => {
      const normalized = normalizeError('Something went wrong');

      expect(normalized).toBeInstanceOf(AppError);
      expect(normalized.message).toBe('Something went wrong');
    });

    it('should handle unknown error types', () => {
      const normalized = normalizeError({ weird: 'object' });

      expect(normalized).toBeInstanceOf(AppError);
      expect(normalized.message).toBe('An unknown error occurred');
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message for AppError', () => {
      const error = new ValidationError('Invalid input');
      const message = getUserMessage(error);

      expect(message).toBe('Invalid input');
    });

    it('should return generic message for unknown errors', () => {
      const message = getUserMessage(new Error('Internal error'));

      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('should handle DatabaseError specifically', () => {
      const error = new DatabaseError('Database connection failed');
      const message = getUserMessage(error);

      expect(message).toBe('Database connection failed');
    });
  });

  describe('fromPostgrestError', () => {
    it('should convert duplicate key error', () => {
      const pgError = {
        message: 'duplicate key value',
        code: '23505',
        details: 'Key already exists',
        hint: 'Try a different value',
      };

      const error = fromPostgrestError(pgError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('This record already exists');
    });

    it('should convert foreign key error', () => {
      const pgError = {
        message: 'foreign key violation',
        code: '23503',
        details: 'Referenced record not found',
        hint: '',
      };

      const error = fromPostgrestError(pgError);

      expect(error.message).toBe('Referenced record does not exist');
    });

    it('should preserve original message for unknown codes', () => {
      const pgError = {
        message: 'Unknown database error',
        code: '99999',
        details: '',
        hint: '',
      };

      const error = fromPostgrestError(pgError);

      expect(error.message).toBe('Unknown database error');
    });
  });
});

