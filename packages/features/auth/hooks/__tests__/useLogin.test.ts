import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { useLogin } from '../useLogin';
import { toast } from 'sonner';

// Credentials hardcoded in the hook's internal mockLogin function
const SUCCESS_EMAIL = 'admin@example.com';
const SUCCESS_PASSWORD = 'password123';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLogin', () => {
  it('starts with isLoading=false, error=null, no fieldErrors', () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
  });

  it('sets isLoading=true while request is pending', async () => {
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.login({ email: SUCCESS_EMAIL, password: SUCCESS_PASSWORD });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('on success: navigates to /dashboard and shows toast.success', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      result.current.login({ email: SUCCESS_EMAIL, password: SUCCESS_PASSWORD });
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeUndefined(); // hook doesn't expose success state
    expect(toast.success).toHaveBeenCalledWith('Вход выполнен успешно!');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('on failure: sets error, fieldErrors and calls toast.error', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      result.current.login({ email: 'wrong@example.com', password: 'badpass' });
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe('Неверный email или пароль');
    expect(result.current.fieldErrors).toMatchObject({ email: true, password: true });
    expect(toast.error).toHaveBeenCalledWith('Неверный email или пароль');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('resets fieldErrors and error on each new login attempt', async () => {
    const { result } = renderHook(() => useLogin());

    // First call: failure
    await act(async () => {
      result.current.login({ email: 'bad@test.com', password: 'bad' });
      await vi.runAllTimersAsync();
    });
    expect(result.current.error).not.toBeNull();

    // Second call: success
    await act(async () => {
      result.current.login({ email: SUCCESS_EMAIL, password: SUCCESS_PASSWORD });
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
  });

  it('clearFieldError removes a specific field from fieldErrors', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      result.current.login({ email: 'bad@test.com', password: 'bad' });
      await vi.runAllTimersAsync();
    });

    expect(result.current.fieldErrors.email).toBe(true);

    act(() => {
      result.current.clearFieldError('email');
    });

    expect(result.current.fieldErrors.email).toBeUndefined();
    expect(result.current.fieldErrors.password).toBe(true); // other errors untouched
  });
});
