import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockChangePassword = vi.fn();
const mockClearFieldError = vi.fn();
let mockHookState = {
  changePassword: mockChangePassword,
  isLoading: false,
  error: null as string | null,
  success: false,
  fieldErrors: {} as Record<string, boolean>,
  clearFieldError: mockClearFieldError,
};

vi.mock('@features/auth/hooks/useChangePassword', () => ({
  useChangePassword: () => mockHookState,
}));

import { ChangePasswordModal } from '../change-password-modal';

beforeEach(() => {
  vi.clearAllMocks();
  mockHookState = {
    changePassword: mockChangePassword,
    isLoading: false,
    error: null,
    success: false,
    fieldErrors: {},
    clearFieldError: mockClearFieldError,
  };
});

describe('ChangePasswordModal', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <ChangePasswordModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when isOpen=true', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Смена пароля')).toBeInTheDocument();
  });

  it('renders all three password fields', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Текущий пароль')).toBeInTheDocument();
    expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
    expect(screen.getByLabelText('Подтвердите новый пароль')).toBeInTheDocument();
  });

  it('shows password requirements info block', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Требования к паролю/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Изменить пароль/i }));
    await waitFor(() => {
      expect(screen.getByText(/Введите текущий пароль/i)).toBeInTheDocument();
    });
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password is too short', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Текущий пароль'), { target: { value: 'current' } });
    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Подтвердите новый пароль'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /Изменить пароль/i }));
    await waitFor(() => {
      expect(screen.getByText(/минимум 8 символов/i)).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Текущий пароль'), { target: { value: 'current' } });
    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'newPass123' } });
    fireEvent.change(screen.getByLabelText('Подтвердите новый пароль'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /Изменить пароль/i }));
    await waitFor(() => {
      expect(screen.getByText(/Пароли не совпадают/i)).toBeInTheDocument();
    });
  });

  it('calls changePassword with correct data on valid submit', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Текущий пароль'), { target: { value: 'oldPass123' } });
    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'newPass456' } });
    fireEvent.change(screen.getByLabelText('Подтвердите новый пароль'), { target: { value: 'newPass456' } });
    fireEvent.click(screen.getByRole('button', { name: /Изменить пароль/i }));
    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        oldPassword: 'oldPass123',
        newPassword: 'newPass456',
        confirmPassword: 'newPass456',
      });
    });
  });

  it('shows server error message', () => {
    mockHookState = { ...mockHookState, error: 'Неверный текущий пароль' };
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Неверный текущий пароль')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ChangePasswordModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Отмена/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state while submitting', () => {
    mockHookState = { ...mockHookState, isLoading: true };
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Изменение/i)).toBeInTheDocument();
  });

  it('disables buttons while loading', () => {
    mockHookState = { ...mockHookState, isLoading: true };
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Отмена/i })).toBeDisabled();
  });

  it('toggles old password visibility', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Текущий пароль');
    expect(input).toHaveAttribute('type', 'password');
    // The toggle button is a sibling in the same relative container as the input
    const toggleButton = input.parentElement!.querySelector('button[type="button"]')!;
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
  });
});
