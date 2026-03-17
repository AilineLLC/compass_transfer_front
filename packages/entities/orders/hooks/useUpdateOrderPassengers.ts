import { useMutation } from '@tanstack/react-query';
import { OrdersApi } from '../api/orders';

/**
 * Интерфейс пассажира для обновления
 */
export interface UpdatePassengerData {
  customerId: string | null;
  firstName: string;
  lastName: string | null;
  phone?: string | null;
  isMainPassenger: boolean;
}

/**
 * Опции для хука обновления пассажиров заказа
 */
export interface UseUpdateOrderPassengersOptions {
  /** Колбэк при успешном обновлении */
  onSuccess?: () => void;

  /** Колбэк при ошибке */
  onError?: (error: Error) => void;

  /** Колбэк при завершении (успех или ошибка) */
  onSettled?: () => void;
}

/**
 * Результат хука обновления пассажиров заказа
 */
export interface UseUpdateOrderPassengersResult {
  /** Функция обновления пассажиров */
  updatePassengers: (orderId: string, passengers: UpdatePassengerData[]) => void;

  /** Состояние загрузки */
  isLoading: boolean;

  /** Ошибка */
  error: Error | null;

  /** Сброс состояния */
  reset: () => void;
}

/**
 * Хук для обновления пассажиров заказа
 * PUT /Order/{uuid}/passengers
 */
export function useUpdateOrderPassengers(
  options: UseUpdateOrderPassengersOptions = {}
): UseUpdateOrderPassengersResult {
  const { onSuccess, onError, onSettled } = options;

  const mutation = useMutation({
    mutationFn: ({ orderId, passengers }: { orderId: string; passengers: UpdatePassengerData[] }) => {
      return OrdersApi.updateOrderPassengers(orderId, passengers);
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error: Error) => {
      onError?.(error);
    },
    onSettled,
  });

  return {
    updatePassengers: (orderId: string, passengers: UpdatePassengerData[]) => 
      mutation.mutate({ orderId, passengers }),
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
