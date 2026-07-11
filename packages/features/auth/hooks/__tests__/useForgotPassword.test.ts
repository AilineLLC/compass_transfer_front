import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@shared/lib', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { useForgotPassword } from '../useForgotPassword';
import { toast } from 'sonner';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useForgotPassword', () => {
  it('starts with correct initial state', () => {
    const { result } = renderHook(() => useForgotPassword());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.fieldErrors).toEqual({});
  });

  it('sets isLoading=true during the request', async () => {
    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.forgotPassword({ email: 'user@test.com' });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets success=true and shows toasts on valid email', async () => {
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      result.current.forgotPassword({ email: 'user@test.com' });
      await vi.runAllTimersAsync();
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(toast.success).toHaveBeenCalled();
  });

  it('redirects to reset-password page after 2s on success', async () => {
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      result.current.forgotPassword({ email: 'user@test.com' });
      await vi.runAllTimersAsync();
    });

    expect(mockPush).toHaveBeenCalledWith(
      '/auth/reset-password?email=user%40test.com',
    );
  });

  it('sets error and fieldErrors.email on failure (no @ in email)', async () => {
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      result.current.forgotPassword({ email: 'notanemail' });
      await vi.runAllTimersAsync();
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Пользователь с таким email не найден');
    expect(result.current.fieldErrors.email).toBe(true);
    expect(toast.error).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('clearFieldError removes the specified field', async () => {
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      result.current.forgotPassword({ email: 'notanemail' });
      await vi.runAllTimersAsync();
    });

    expect(result.current.fieldErrors.email).toBe(true);

    act(() => {
      result.current.clearFieldError('email');
    });

    expect(result.current.fieldErrors.email).toBeUndefined();
  });
});
