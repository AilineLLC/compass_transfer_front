import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));
vi.mock('@shared/lib', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const { mockChangePassword } = vi.hoisted(() => ({
  mockChangePassword: vi.fn(),
}));

vi.mock('@shared/api/auth-service', () => ({
  AuthService: { changePassword: mockChangePassword },
}));

import { useChangePassword } from '../useChangePassword';
import { toast } from 'sonner';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useChangePassword', () => {
  it('starts with isLoading=false, error=null, success=false', () => {
    const { result } = renderHook(() => useChangePassword());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.fieldErrors).toEqual({});
  });

  it('sets isLoading=true while the request is in progress', async () => {
    let resolveApi!: (v: unknown) => void;
    mockChangePassword.mockReturnValue(new Promise(r => (resolveApi = r)));

    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.changePassword({
        oldPassword: 'old',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveApi({ data: { email: 'u@t.com', isEmailConfirmed: true } });
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets success=true and calls toast.success on API success', async () => {
    mockChangePassword.mockResolvedValue({
      data: { email: 'u@t.com', isEmailConfirmed: true },
    });

    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      await result.current.changePassword({
        oldPassword: 'old',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('Пароль успешно изменен!');
  });

  it('sets error and calls toast.error when API returns an error', async () => {
    mockChangePassword.mockResolvedValue({
      error: { message: 'Неверный текущий пароль' },
    });

    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      await result.current.changePassword({
        oldPassword: 'wrongOld',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Неверный текущий пароль');
    expect(toast.error).toHaveBeenCalledWith('Неверный текущий пароль');
  });

  it('sets fallback error message when API error has no message', async () => {
    mockChangePassword.mockResolvedValue({ error: {} });

    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      await result.current.changePassword({
        oldPassword: 'old',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
    });

    expect(result.current.error).toBe('Произошла ошибка при смене пароля');
  });

  it('handles thrown errors (network failure etc)', async () => {
    mockChangePassword.mockRejectedValue(new Error('Сеть недоступна'));

    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      await result.current.changePassword({
        oldPassword: 'old',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
    });

    expect(result.current.error).toBe('Сеть недоступна');
    expect(result.current.success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Сеть недоступна');
  });

  it('clears a specific field error via clearFieldError', () => {
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      // Manually poke the internal state through a failed call
      mockChangePassword.mockResolvedValue({ error: { message: 'err' } });
    });

    act(() => {
      result.current.clearFieldError('oldPassword');
    });

    expect(result.current.fieldErrors.oldPassword).toBeUndefined();
  });

  it('resets error and success on each new call', async () => {
    mockChangePassword.mockResolvedValueOnce({ error: { message: 'err' } });
    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      await result.current.changePassword({
        oldPassword: 'old',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
    });
    expect(result.current.error).not.toBeNull();

    mockChangePassword.mockResolvedValueOnce({
      data: { email: 'u@t.com', isEmailConfirmed: true },
    });

    await act(async () => {
      await result.current.changePassword({
        oldPassword: 'old',
        newPassword: 'newPass123',
        confirmPassword: 'newPass123',
      });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(true);
  });
});
