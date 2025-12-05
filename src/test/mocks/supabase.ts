// Supabase Client Mock
// Reusable mock for Supabase client in tests

import { vi } from 'vitest';

export const createMockSupabaseClient = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockIn = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockOr = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockRange = vi.fn();
  const mockLimit = vi.fn().mockReturnThis();

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    in: mockIn,
    gte: mockGte,
    lte: mockLte,
    or: mockOr,
    order: mockOrder,
    range: mockRange,
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  }));

  const mockAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  };

  return {
    from: mockFrom,
    auth: mockAuth,
    // Expose individual mocks for easier test setup
    _mocks: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      in: mockIn,
      gte: mockGte,
      lte: mockLte,
      or: mockOr,
      order: mockOrder,
      range: mockRange,
      limit: mockLimit,
      from: mockFrom,
      auth: mockAuth,
    },
  };
};

export const mockSupabaseClient = createMockSupabaseClient();
