import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OrdersApi } from '../api/orders';

/**
 * Опции для хука удаления поездки
 */
export interface UseDeleteRideOptions {
  /** Колбэк при успешном удалении */
  onSuccess?: () => void;

  /** Колбэк при ошибке */
  onError?: (error: Error) => void;

  /** Колбэк при завершении (успех или ошибка) */
  onSettled?: () => void;

  /** Показывать ли тосты */
  showToast?: boolean;
}

/**
 * Результат хука удаления поездки
 */
export interface UseDeleteRideResult {
  /** Функция удаления поездки */
  deleteRide: (rideId: string) => Promise<void>;

  /** Состояние загрузки */
  isLoading: boolean;

  /** Ошибка удаления */
  error: Error | null;

  /** Сброс состояния */
  reset: () => void;
}

/**
 * Хук для удаления поездки
 */
export function useDeleteRide(options: UseDeleteRideOptions = {}): UseDeleteRideResult {
  const { onSuccess, onError, onSettled, showToast = true } = options;

  const mutation = useMutation({
    mutationFn: (rideId: string) => {
      return OrdersApi.deleteRide(rideId);
    },
    onSuccess: () => {
      if (showToast) {
        toast.success('✅ Поездка удалена успешно');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(`❌ Ошибка удаления поездки: ${error.message}`);
      }
      onError?.(error);
    },
    onSettled,
  });

  return {
    deleteRide: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
