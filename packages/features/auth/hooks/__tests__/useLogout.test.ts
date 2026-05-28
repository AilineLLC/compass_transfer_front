import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));
vi.mock('@shared/lib', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { useLogout } from '../useLogout';
import { toast } from 'sonner';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLogout', () => {
  it('starts with isLoggingOut=false, error=null, success=false', () => {
    const { result } = renderHook(() => useLogout());
    expect(result.current.isLoggingOut).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('sets isLoggingOut=true while request is pending', async () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current.logout();
    });

    expect(result.current.isLoggingOut).toBe(true);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoggingOut).toBe(false);
  });

  it('sets success=true, navigates to /auth/login, and shows toast.success', async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout();
      await vi.runAllTimersAsync();
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('Выход выполнен успешно!');
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('calls leaveQueue when isInQueue=true before logging out', async () => {
    const mockLeaveQueue = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout({ isInQueue: true, leaveQueue: mockLeaveQueue });
      await vi.runAllTimersAsync();
    });

    expect(mockLeaveQueue).toHaveBeenCalledTimes(1);
    expect(result.current.success).toBe(true);
  });

  it('continues logout even when leaveQueue throws', async () => {
    const failingLeaveQueue = vi.fn().mockRejectedValue(new Error('Queue error'));
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout({ isInQueue: true, leaveQueue: failingLeaveQueue });
      await vi.runAllTimersAsync();
    });

    // logout should still succeed despite queue error
    expect(result.current.success).toBe(true);
    expect(toast.warning).toHaveBeenCalled();
  });

  it('does NOT call leaveQueue when isInQueue=false', async () => {
    const mockLeaveQueue = vi.fn();
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      result.current.logout({ isInQueue: false, leaveQueue: mockLeaveQueue });
      await vi.runAllTimersAsync();
    });

    expect(mockLeaveQueue).not.toHaveBeenCalled();
  });

  it('clearFieldError removes the specified key from fieldErrors', () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current.clearFieldError('someField');
    });

    expect(result.current.fieldErrors).toEqual({});
  });
});
