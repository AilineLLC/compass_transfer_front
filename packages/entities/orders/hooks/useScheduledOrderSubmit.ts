import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiRequestError } from '@shared/api/client';
import { OrdersApi, type CreateScheduledOrderRequest } from '../api/orders';
import { OrderStatus } from '../enums';
import type { GetOrderDTO, UpdateScheduledOrderDTO } from '../interface';

/**
 * Преобразует данные создания заказа в данные для обновления
 */
function convertToUpdateData(data: CreateScheduledOrderRequest, orderId: string): UpdateScheduledOrderDTO {
  const updateData: UpdateScheduledOrderDTO = {
    orderId,
    tariffId: data.tariffId,
    routeId: data.routeId || null,
    startLocationId: data.startLocationId || null,
    endLocationId: data.endLocationId || null,
    startAddress: data.startAddress || '',
    endAddress: data.endAddress || '',
    additionalStops: data.additionalStops || [],
    services: data.services || [],
    initialPrice: data.initialPrice,
    scheduledTime: data.scheduledTime,
    passengers: [], // Пассажиры обновляются отдельным запросом
    status: (data.status as string) || (OrderStatus.Pending as string),
    subStatus: (data as any).subStatus || 'SearchingDriver',
    // Поля, которые ранее дропались при обновлении
    description: data.description ?? null,
    airFlight: data.airFlight ?? null,
    flyReis: data.flyReis ?? null,
    notes: data.notes ?? null,
    operatorNotes: data.operatorNotes ?? null,
    paymentMethodType: data.paymentMethodType ?? null,
    driverPrice: data.driverPrice ?? null,
  };

  return updateData;
}

/**
 * Опции для хука отправки запланированного заказа
 */
export interface UseScheduledOrderSubmitOptions {
  /** Колбэк при успешной отправке */
  onSuccess?: (order: GetOrderDTO) => void;

  /** Колбэк при ошибке */
  onError?: (error: Error) => void;

  /** Колбэк при завершении (успех или ошибка) */
  onSettled?: () => void;

  /** ID заказа для режима обновления */
  orderId?: string;

  /** Нужно ли обновлять пассажиров отдельным запросом */
  shouldUpdatePassengers?: boolean;

  /** Данные пассажиров для обновления */
  passengers?: Array<{
    customerId: string | null;
    firstName: string;
    lastName: string | null;
    phone?: string | null;
    isMainPassenger: boolean;
  }>;
}

/**
 * Результат хука отправки запланированного заказа
 */
export interface UseScheduledOrderSubmitResult {
  /** Функция отправки заказа */
  submitOrder: (data: CreateScheduledOrderRequest) => Promise<GetOrderDTO>;

  /** Состояние загрузки */
  isLoading: boolean;

  /** Ошибка отправки */
  error: Error | null;

  /** Результат отправки */
  data: GetOrderDTO | null;

  /** Сброс состояния */
  reset: () => void;
}

/**
 * Хук для отправки запланированного заказа
 */
export function useScheduledOrderSubmit(
  options: UseScheduledOrderSubmitOptions = {}
): UseScheduledOrderSubmitResult {
  const {
    onSuccess,
    onError,
    onSettled,
    orderId,
    shouldUpdatePassengers,
    passengers
  } = options;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateScheduledOrderRequest) => {
      // Режим обновления
      if (orderId) {
        const updateData = convertToUpdateData(data, orderId);
        const updatedOrder = await OrdersApi.updateScheduledOrder(orderId, updateData);

        // Обновляем пассажиров отдельным запросом (если переданы)
        if (shouldUpdatePassengers && passengers && passengers.length > 0) {
          await OrdersApi.updateOrderPassengers(orderId, passengers);
        }

        return updatedOrder;
      }

      // Режим создания
      return OrdersApi.createScheduledOrder(data);
    },

    onSuccess: (data: GetOrderDTO) => {
      toast.success(
        `✅ Заказ ${orderId ? 'обновлен' : 'создан'} успешно`
      );

      // Инвалидируем кэш для обновленного заказа
      if (orderId) {
        queryClient.invalidateQueries({
          queryKey: ['scheduled-order', orderId]
        });
      }

      onSuccess?.(data);
    },

    onError: (error: Error) => {
      if (error instanceof ApiRequestError && error.apiError.errors) {
        const allMessages = Object.values(error.apiError.errors).flat();
        allMessages.forEach(msg => toast.error(msg));
      } else {
        toast.error(`❌ Ошибка ${orderId ? 'обновления' : 'создания'} заказа: ${error.message}`);
      }
      onError?.(error);
    },

    onSettled: () => {
      onSettled?.();
    }
  });

  return {
    submitOrder: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data || null,
    reset: mutation.reset
  };
}


