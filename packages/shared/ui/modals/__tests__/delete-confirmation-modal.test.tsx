import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteConfirmationModal } from '../delete-confirmation-modal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn().mockResolvedValue(undefined),
  title: 'Удалить запись',
  description: 'Вы уверены, что хотите удалить?',
};

beforeEach(() => {
  vi.clearAllMocks();
  defaultProps.onConfirm = vi.fn().mockResolvedValue(undefined);
});

describe('DeleteConfirmationModal', () => {
  it('renders title and description when open', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Удалить запись')).toBeInTheDocument();
    expect(screen.getByText('Вы уверены, что хотите удалить?')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(<DeleteConfirmationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Удалить запись')).not.toBeInTheDocument();
  });

  it('renders itemName when provided', () => {
    render(<DeleteConfirmationModal {...defaultProps} itemName="Тестовый элемент" />);
    expect(screen.getByText(/Тестовый элемент/)).toBeInTheDocument();
  });

  it('renders warningText when provided', () => {
    render(<DeleteConfirmationModal {...defaultProps} warningText="Будьте осторожны!" />);
    expect(screen.getByText('Будьте осторожны!')).toBeInTheDocument();
  });

  it('does not render itemName block when itemName is not provided', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    expect(screen.queryByText(/Удаляемый элемент/)).not.toBeInTheDocument();
  });

  it('shows permanent irreversibility warning', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Это действие необратимо')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<DeleteConfirmationModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Отмена/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Delete button is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<DeleteConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /Удалить/i }));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose after successful deletion', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<DeleteConfirmationModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Удалить/i }));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows loading state during deletion', async () => {
    let resolveConfirm!: () => void;
    const onConfirm = vi.fn(
      () => new Promise<void>(resolve => { resolveConfirm = resolve; }),
    );
    render(<DeleteConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /Удалить/i }));
    await waitFor(() => {
      expect(screen.getByText(/Удаление/i)).toBeInTheDocument();
    });
    resolveConfirm();
  });

  it('disables Cancel button while deleting', async () => {
    let resolveConfirm!: () => void;
    const onConfirm = vi.fn(
      () => new Promise<void>(resolve => { resolveConfirm = resolve; }),
    );
    render(<DeleteConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /Удалить/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Отмена/i })).toBeDisabled();
    });
    resolveConfirm();
  });

  it('does not close when error is thrown from onConfirm', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Delete failed'));
    render(<DeleteConfirmationModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Удалить/i }));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
