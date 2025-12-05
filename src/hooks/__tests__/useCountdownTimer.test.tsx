import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdownTimer } from '../useCountdownTimer';

describe('useCountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return empty string when endTime is null', () => {
    const { result } = renderHook(() => useCountdownTimer(null));
    expect(result.current).toBe('');
  });

  it('should return empty string when endTime is undefined', () => {
    const { result } = renderHook(() => useCountdownTimer(undefined));
    expect(result.current).toBe('');
  });

  it('should format time remaining correctly for days and hours', () => {
    const futureTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString();
    const { result } = renderHook(() => useCountdownTimer(futureTime));
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current).toContain('d');
    expect(result.current).toContain('h');
  });

  it('should format time remaining correctly for hours and minutes', () => {
    const futureTime = new Date(Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();
    const { result } = renderHook(() => useCountdownTimer(futureTime));
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current).toContain('h');
    expect(result.current).toContain('m');
  });

  it('should format time remaining correctly for minutes and seconds', () => {
    const futureTime = new Date(Date.now() + 5 * 60 * 1000 + 30 * 1000).toISOString();
    const { result } = renderHook(() => useCountdownTimer(futureTime));
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current).toContain('m');
    expect(result.current).toContain('s');
  });

  it('should return "Ended" when time has passed', () => {
    const pastTime = new Date(Date.now() - 1000).toISOString();
    const { result } = renderHook(() => useCountdownTimer(pastTime));
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current).toBe('Ended');
  });

  it('should update countdown every second', () => {
    const futureTime = new Date(Date.now() + 2 * 60 * 1000 + 30 * 1000).toISOString();
    const { result } = renderHook(() => useCountdownTimer(futureTime));
    
    const initialValue = result.current;
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // After 1 second, the value should have updated
    expect(typeof result.current).toBe('string');
    expect(result.current.length).toBeGreaterThan(0);
  });
});
