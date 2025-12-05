import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../useIsMobile';

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  it('should return true for mobile width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('should return false for desktop width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('should update when window is resized', () => {
    let resizeHandler: ((event: Event) => void) | null = null;

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    window.addEventListener = vi.fn((event: string, listener: EventListenerOrEventListenerObject) => {
      if (event === 'resize' && typeof listener === 'function') {
        resizeHandler = listener;
      }
    }) as typeof window.addEventListener;

    window.removeEventListener = vi.fn() as typeof window.removeEventListener;

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);

    // Simulate resize to desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    act(() => {
      if (resizeHandler) {
        resizeHandler(new Event('resize'));
      }
    });

    expect(result.current).toBe(false);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.fn();
    window.removeEventListener = removeEventListenerSpy;

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
