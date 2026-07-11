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

import { useResetPassword } from '../useResetPassword';
import { toast } from 'sonner';

// Credentials hardcoded in the hook's internal mockResetPassword
const VALID_CODE = '123456';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useResetPassword', () => {
  it('starts with correct initial state', () => {
    const { result } = renderHook(() => useResetPassword());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.fieldErrors).toEqual({});
  });

  it('sets isLoading=true while request is pending', async () => {
    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.resetPassword({
        resetCode: VALID_CODE,
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets success=true and shows toast.success on valid code and password', async () => {
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      result.current.resetPassword({
        resetCode: VALID_CODE,
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
      await vi.runAllTimersAsync();
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(toast.success).toHaveBeenCalled();
  });

  it('redirects to /auth/login after 2s on success', async () => {
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      result.current.resetPassword({
        resetCode: VALID_CODE,
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
      await vi.runAllTimersAsync();
    });

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('sets error and fieldErrors.resetCode when code is wrong', async () => {
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      result.current.resetPassword({
        resetCode: 'wrongCode',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
      await vi.runAllTimersAsync();
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Неверный код сброса или код истек');
    expect(result.current.fieldErrors.resetCode).toBe(true);
    expect(toast.error).toHaveBeenCalled();
  });

  it('sets error and fieldErrors.newPassword when password is too short', async () => {
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      result.current.resetPassword({
        resetCode: VALID_CODE,
        newPassword: 'short',
        confirmPassword: 'short',
      });
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe('Пароль слишком короткий');
    expect(result.current.fieldErrors.newPassword).toBe(true);
    expect(toast.error).toHaveBeenCalled();
  });

  it('clearFieldError removes the specified field error', async () => {
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      result.current.resetPassword({
        resetCode: 'wrongCode',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
      await vi.runAllTimersAsync();
    });

    expect(result.current.fieldErrors.resetCode).toBe(true);

    act(() => {
      result.current.clearFieldError('resetCode');
    });

    expect(result.current.fieldErrors.resetCode).toBeUndefined();
  });

  it('resets state on each new call', async () => {
    const { result } = renderHook(() => useResetPassword());

    // First call: failure
    await act(async () => {
      result.current.resetPassword({
        resetCode: 'bad',
        newPassword: 'pass12345',
        confirmPassword: 'pass12345',
      });
      await vi.runAllTimersAsync();
    });
    expect(result.current.error).not.toBeNull();

    // Second call: success
    await act(async () => {
      result.current.resetPassword({
        resetCode: VALID_CODE,
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.success).toBe(true);
  });
});
