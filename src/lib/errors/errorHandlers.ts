// Centralized Error Handlers
// Unified error handling utilities

import { PostgrestError } from '@supabase/supabase-js';
import {
  AppError,
  DatabaseError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  isAppError,
} from './errorTypes';
import type { ApiError } from '@/types/api';

// Map Supabase/Postgres error codes to user-friendly messages
const POSTGRES_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'This record already exists',
  '23503': 'Referenced record does not exist',
  '23502': 'Required field is missing',
  '42501': 'You do not have permission to perform this action',
  '42P01': 'Table not found',
  'PGRST116': 'Record not found',
  'PGRST301': 'Row-level security violation',
};

// Convert Supabase PostgrestError to AppError
export const fromPostgrestError = (error: PostgrestError): DatabaseError => {
  const message = POSTGRES_ERROR_MESSAGES[error.code] || error.message;
  return new DatabaseError(message, error.details || error.hint);
};

// Convert unknown error to AppError
export const normalizeError = (error: unknown): AppError => {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // PostgrestError from Supabase
  if (isPostgrestError(error)) {
    return fromPostgrestError(error);
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError('Unable to connect to the server');
    }
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, true);
  }

  // String error
  if (typeof error === 'string') {
    return new AppError(error, 'UNKNOWN_ERROR', 500, true);
  }

  // Unknown error type
  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, false);
};

// Type guard for PostgrestError
export const isPostgrestError = (error: unknown): error is PostgrestError => {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  return typeof e.code === 'string' && typeof e.message === 'string';
};

// Convert AppError to ApiError format
export const toApiError = (error: AppError): ApiError => ({
  code: error.code,
  message: error.message,
  details: error.details,
  statusCode: error.statusCode,
});

// Get user-friendly error message
export const getUserMessage = (error: unknown): string => {
  const normalized = normalizeError(error);
  
  // Return specific messages for known error types
  switch (normalized.code) {
    case 'AUTHENTICATION_ERROR':
      return 'Please sign in to continue';
    case 'AUTHORIZATION_ERROR':
      return 'You do not have permission to perform this action';
    case 'NOT_FOUND':
      return normalized.message;
    case 'VALIDATION_ERROR':
      return normalized.message;
    case 'NETWORK_ERROR':
      return 'Unable to connect. Please check your internet connection.';
    case 'RATE_LIMIT_ERROR':
      return 'Too many requests. Please try again later.';
    case 'DATABASE_ERROR':
      return normalized.message;
    default:
      return 'Something went wrong. Please try again.';
  }
};

// Log error for debugging (in development) and tracking (in production)
export const logError = (error: unknown, context?: string): void => {
  const normalized = normalizeError(error);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'Error'}]:`, {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
      stack: normalized.stack,
    });
  }
  
  // Send to Sentry in production (if configured)
  if (process.env.NODE_ENV === 'production') {
    // Lazy import Sentry to avoid bundling in development
    import('@sentry/react').then((Sentry) => {
      Sentry.captureException(error, {
        tags: {
          context: context || 'Unknown',
          errorCode: normalized.code,
        },
        extra: {
          message: normalized.message,
          details: normalized.details,
          statusCode: normalized.statusCode,
        },
      });
    }).catch(() => {
      // Silently fail if Sentry is not available
      // Fallback to console.error in production
      console.error(`[${context || 'Error'}]:`, normalized.message);
    });
  }
};

// Handle error and return user message (convenience function)
export const handleError = (error: unknown, context?: string): string => {
  logError(error, context);
  return getUserMessage(error);
};

// Async error wrapper for service methods
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    logError(error, context);
    return { data: null, error: normalizeError(error) };
  }
};

// Create error response helper
export const createErrorResponse = (
  message: string,
  code: string = 'ERROR',
  statusCode: number = 400
): { error: ApiError } => ({
  error: {
    code,
    message,
    statusCode,
  },
});
