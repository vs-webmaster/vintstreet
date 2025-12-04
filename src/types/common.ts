// Common shared types used across the application

// Base entity with common fields
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

// UUID type alias for clarity
export type UUID = string;

// Timestamp type alias
export type Timestamp = string;

// JSON type for flexible data
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];

// Generic status type
export type StatusType = 'active' | 'inactive' | 'pending' | 'archived';

// Sort direction
export type SortDirection = 'asc' | 'desc';

// Nullable type helper
export type Nullable<T> = T | null;

// Optional type helper (for partial updates)
export type Optional<T> = T | undefined;

// Deep partial (all nested properties optional)
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Pick with required fields
export type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

// Async function type
export type AsyncFunction<T = void, A extends unknown[] = []> = (...args: A) => Promise<T>;

// Event handler type
export type EventHandler<T = void> = (event: T) => void;

// Form field error
export interface FieldError {
  field: string;
  message: string;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: FieldError[];
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Pagination state
export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Filter state (generic)
export interface FilterState<T = Record<string, unknown>> {
  filters: T;
  isFiltered: boolean;
  activeFilterCount: number;
}

// Selection state
export interface SelectionState<T = string> {
  selected: Set<T>;
  isAllSelected: boolean;
  selectedCount: number;
}

// Modal state
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

// Toast/Notification types
export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastMessage {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Price formatting options
export interface PriceFormatOptions {
  currency?: string;
  locale?: string;
  showCurrency?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// Date formatting options
export interface DateFormatOptions {
  format?: 'short' | 'medium' | 'long' | 'full';
  includeTime?: boolean;
  relative?: boolean;
}

// Excel/CSV row data type (for bulk uploads)
export type ExcelRowData = Record<string, string | number | boolean | null | undefined>;

// Failed row with error information
export interface FailedRow extends ExcelRowData {
  error_reason: string;
}

// Generic object update type (for partial updates)
export type ObjectUpdate<T = Record<string, unknown>> = Partial<T> & Record<string, unknown>;

// Supabase query result type helper
export type SupabaseQueryResult<T> = T | null | undefined;