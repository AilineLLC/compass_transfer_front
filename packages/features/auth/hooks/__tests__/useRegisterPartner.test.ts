import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@shared/lib', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const { mockRegisterPartner } = vi.hoisted(() => ({
  mockRegisterPartner: vi.fn(),
}));

vi.mock('@shared/api/auth-service', () => ({
  AuthService: { registerPartner: mockRegisterPartner },
}));

import { useRegisterPartner } from '../useRegisterPartner';
import { toast } from 'sonner';

const validData = {
  email: 'partner@test.com',
  password: 'pass123',
  fullName: 'Иван Иванов',
  companyName: 'ООО Транспорт',
  legalAddress: 'г. Бишкек',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRegisterPartner', () => {
  it('starts with correct initial state', () => {
    const { result } = renderHook(() => useRegisterPartner());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.fieldErrors).toEqual({});
  });

  it('sets success=true and calls toast.success on successful registration', async () => {
    mockRegisterPartner.mockResolvedValue({
      data: { message: 'Регистрация успешно завершена', success: true },
    });

    const { result } = renderHook(() => useRegisterPartner());

    await act(async () => {
      await result.current.registerPartner(validData);
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(toast.success).toHaveBeenCalled();
  });

  it('redirects to /login after 2s on successful registration', async () => {
    mockRegisterPartner.mockResolvedValue({
      data: { message: 'OK', success: true },
    });

    const { result } = renderHook(() => useRegisterPartner());

    await act(async () => {
      await result.current.registerPartner(validData);
    });

    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('sets error when API returns an error', async () => {
    mockRegisterPartner.mockResolvedValue({
      error: { message: 'Произошла ошибка при регистрации' },
    });

    const { result } = renderHook(() => useRegisterPartner());

    await act(async () => {
      await result.current.registerPartner(validData);
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Произошла ошибка при регистрации');
    expect(toast.error).toHaveBeenCalled();
  });

  it('sets fieldErrors.email when error contains "Email" and "уже используется"', async () => {
    mockRegisterPartner.mockResolvedValue({
      error: { message: 'Email уже используется' },
    });

    const { result } = renderHook(() => useRegisterPartner());

    await act(async () => {
      await result.current.registerPartner(validData);
    });

    expect(result.current.fieldErrors.email).toBe(true);
  });

  it('does NOT set fieldErrors.email for unrelated error messages', async () => {
    mockRegisterPartner.mockResolvedValue({
      error: { message: 'Ошибка сервера' },
    });

    const { result } = renderHook(() => useRegisterPartner());

    await act(async () => {
      await result.current.registerPartner(validData);
    });

    expect(result.current.fieldErrors.email).toBeUndefined();
  });

  it('handles thrown exceptions', async () => {
    mockRegisterPartner.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRegisterPartner());

    await act(async () => {
      await result.current.registerPartner(validData);
    });

    expect(result.current.error).toBe('Произошла ошибка при регистрации');
    expect(toast.error).toHaveBeenCalled();
  });

  it('clearFieldError removes the specified field error', async () => {
    mockRegisterPartner.mockResolvedValue({
      error: { message: 'Email уже используется' },
    });

    const { result } = renderHook(() => useRegisterPartner());

    await act(async () => {
      await result.current.registerPartner(validData);
    });

    expect(result.current.fieldErrors.email).toBe(true);

    act(() => {
      result.current.clearFieldError('email');
    });

    expect(result.current.fieldErrors.email).toBeUndefined();
  });
});
