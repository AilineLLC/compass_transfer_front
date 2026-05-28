import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return React.createElement('a', { href }, children);
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockRegisterPartner = vi.fn();
const mockClearFieldError = vi.fn();
let mockHookState = {
  registerPartner: mockRegisterPartner,
  isLoading: false,
  error: null as string | null,
  success: false,
  fieldErrors: {} as Record<string, boolean>,
  clearFieldError: mockClearFieldError,
};

vi.mock('@features/auth/hooks/useRegisterPartner', () => ({
  useRegisterPartner: () => mockHookState,
}));

import { PartnerRegisterForm } from '../partner-register-form';

beforeEach(() => {
  vi.clearAllMocks();
  mockHookState = {
    registerPartner: mockRegisterPartner,
    isLoading: false,
    error: null,
    success: false,
    fieldErrors: {},
    clearFieldError: mockClearFieldError,
  };
});

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText(/Email/i), {
    target: { value: 'partner@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/Пароль/i), {
    target: { value: 'password123' },
  });
  fireEvent.change(screen.getByLabelText(/ФИО/i), {
    target: { value: 'Иван Иванов' },
  });
  fireEvent.change(screen.getByLabelText(/Название компании/i), {
    target: { value: 'ООО Транспорт' },
  });
  fireEvent.change(screen.getByLabelText(/Юридический адрес/i), {
    target: { value: 'г. Бишкек, ул. Примерная, д. 1' },
  });
};

describe('PartnerRegisterForm', () => {
  it('renders all form fields', () => {
    render(<PartnerRegisterForm />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Пароль/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ФИО/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Название компании/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Юридический адрес/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<PartnerRegisterForm />);
    expect(screen.getByRole('button', { name: /Зарегистрироваться/i })).toBeInTheDocument();
  });

  it('renders login link', () => {
    render(<PartnerRegisterForm />);
    expect(screen.getByRole('link', { name: /Войти/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<PartnerRegisterForm />);
    fireEvent.click(screen.getByRole('button', { name: /Зарегистрироваться/i }));
    await waitFor(() => {
      expect(screen.getByText(/Email обязателен/i)).toBeInTheDocument();
    });
    expect(mockRegisterPartner).not.toHaveBeenCalled();
  });

  it('shows email format validation error', async () => {
    render(<PartnerRegisterForm />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'notanemail' } });
    // Use fireEvent.submit to bypass jsdom native HTML5 type="email" validation
    // which would otherwise silently block submission before RHF runs
    const form = screen.getByRole('button', { name: /Зарегистрироваться/i }).closest('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/Некорректный формат email/i)).toBeInTheDocument();
    });
  });

  it('shows password length validation error', async () => {
    render(<PartnerRegisterForm />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Пароль/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /Зарегистрироваться/i }));
    await waitFor(() => {
      expect(screen.getByText(/минимум 6 символов/i)).toBeInTheDocument();
    });
  });

  it('shows fullName validation error', async () => {
    render(<PartnerRegisterForm />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Зарегистрироваться/i }));
    await waitFor(() => {
      expect(screen.getByText(/ФИО обязательно/i)).toBeInTheDocument();
    });
  });

  it('calls registerPartner with correct data on valid submit', async () => {
    render(<PartnerRegisterForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Зарегистрироваться/i }));
    await waitFor(() => {
      expect(mockRegisterPartner).toHaveBeenCalledWith({
        email: 'partner@example.com',
        password: 'password123',
        fullName: 'Иван Иванов',
        companyName: 'ООО Транспорт',
        legalAddress: 'г. Бишкек, ул. Примерная, д. 1',
      });
    });
  });

  it('shows server error from hook', () => {
    mockHookState = { ...mockHookState, error: 'Email уже используется' };
    render(<PartnerRegisterForm />);
    expect(screen.getByText('Email уже используется')).toBeInTheDocument();
  });

  it('shows success state', () => {
    mockHookState = { ...mockHookState, success: true };
    render(<PartnerRegisterForm />);
    expect(screen.getByText(/Регистрация успешна/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();
  });

  it('shows loading text while submitting', () => {
    mockHookState = { ...mockHookState, isLoading: true };
    render(<PartnerRegisterForm />);
    expect(screen.getByRole('button', { name: /Регистрация/i })).toBeInTheDocument();
  });

  it('disables submit button while loading', () => {
    mockHookState = { ...mockHookState, isLoading: true };
    render(<PartnerRegisterForm />);
    expect(screen.getByRole('button', { name: /Регистрация/i })).toBeDisabled();
  });
});
