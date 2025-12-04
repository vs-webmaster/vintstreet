// Centralized API Types
// Common API response and error types

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  pagination?: PaginationParams;
  sort?: SortParams;
  filters?: Record<string, unknown>;
  select?: string;
  relations?: string[];
}

// Result type for service methods (similar to Rust's Result)
export type Result<T, E = ApiError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Create success result
export const success = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

// Create error result
export const failure = <E = ApiError>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// Type guard for Result
export const isSuccess = <T, E>(result: Result<T, E>): result is { success: true; data: T } => {
  return result.success === true;
};

export const isFailure = <T, E>(result: Result<T, E>): result is { success: false; error: E } => {
  return result.success === false;
};

// Unwrap result or throw
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isSuccess(result)) {
    return result.data;
  }
  throw result.error;
};

// Unwrap result or return default
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (isSuccess(result)) {
    return result.data;
  }
  return defaultValue;
};
