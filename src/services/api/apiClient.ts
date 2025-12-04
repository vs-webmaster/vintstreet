// Centralized API Client
// Utilities for Supabase interactions with standardized error handling

import { supabase } from '@/integrations/supabase/client';
import { 
  AppError,
  DatabaseError,
  normalizeError, 
  logError,
  fromPostgrestError,
} from '@/lib/errors';
import type { Result, ApiError } from '@/types/api';
import { success, failure } from '@/types/api';
import type { PostgrestError } from '@supabase/supabase-js';

// Wrap a supabase query with standardized error handling
export async function withErrorHandling<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context?: string
): Promise<Result<T>> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      logError(error, context);
      return failure(fromPostgrestError(error));
    }
    
    if (data === null) {
      return failure(new AppError('No data returned', 'NO_DATA', 404));
    }
    
    return success(data);
  } catch (error) {
    logError(error, context);
    return failure(normalizeError(error));
  }
}

// Wrap a supabase query that may return null (maybeSingle)
export async function withMaybeNull<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context?: string
): Promise<Result<T | null>> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      logError(error, context);
      return failure(fromPostgrestError(error));
    }
    
    return success(data);
  } catch (error) {
    logError(error, context);
    return failure(normalizeError(error));
  }
}

// Wrap a mutation (insert/update/delete) with error handling
export async function withMutation<T>(
  mutationFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context?: string
): Promise<Result<T | null>> {
  try {
    const { data, error } = await mutationFn();
    
    if (error) {
      logError(error, context);
      return failure(fromPostgrestError(error));
    }
    
    return success(data);
  } catch (error) {
    logError(error, context);
    return failure(normalizeError(error));
  }
}

// Export the raw supabase client for direct queries
export { supabase };
