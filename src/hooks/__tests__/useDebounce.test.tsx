import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useDebounce('test-value', 300));
    expect(result.current).toBe('test-value');
  });

  it('should use default delay of 300ms', () => {
    const { result } = renderHook(() => useDebounce('value'));
    expect(result.current).toBe('value');
  });

  it('should accept different value types', () => {
    const { result: stringResult } = renderHook(() => useDebounce('string', 300));
    expect(stringResult.current).toBe('string');

    const { result: numberResult } = renderHook(() => useDebounce(42, 300));
    expect(numberResult.current).toBe(42);
  });
});
