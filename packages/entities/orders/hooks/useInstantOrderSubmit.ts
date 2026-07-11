import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiRequestError } from '@shared/api/client';
import { OrdersApi, type CreateInstantOrderRequest, type CreateInstantOrderByPartnerRequest } from '../api/orders';
import { OrderStatus, PaymentMethodType } from '../enums';
import type { GetOrderDTO, UpdateInstantOrderDTO } from '../interface';

/**
 * Расширенный тип для обновления моментального заказа с полями локаций
 */
type ExtendedUpdateInstantOrderDTO = UpdateInstantOrderDTO & {
  startLocationId?: string | null;
  endLocationId?: string | null;
  additionalStops?: string[];
};

/**
 * Преобразует данные создания заказа в данные для обновления
 */
function convertToUpdateData(data: CreateInstantOrderRequest | CreateInstantOrderByPartnerRequest): ExtendedUpdateInstantOrderDTO {
  // Базовые поля для обновления заказа
  const updateData: ExtendedUpdateInstantOrderDTO = {
    tariffId: data.tariffId,
    routeId: data.routeId || null,
    services: data.services || [],
    initialPrice: data.initialPrice,
    completionTimeEstimate: (data as CreateInstantOrderRequest).completionTimeEstimate || new Date().toISOString(),
    status: OrderStatus.Pending,
    paymentMethodType: (data as CreateInstantOrderRequest).paymentMethodType ?? PaymentMethodType.Cash,
    driverPrice: (data as CreateInstantOrderRequest).driverPrice ?? null,
  };

  // Добавляем поля локаций, если они есть в исходных данных
  if ('startLocationId' in data) {
    updateData.startLocationId = data.startLocationId || null;
  }
  if ('endLocationId' in data) {
    updateData.endLocationId = data.endLocationId || null;
  }
  if ('additionalStops' in data) {
    updateData.additionalStops = data.additionalStops || [];
  }

  return updateData;
}

/**
 * Опции для хука создания/обновления моментального заказа
 */
export interface UseInstantOrderSubmitOptions {
  /** Колбэк при успешном создании/обновлении */
  onSuccess?: (order: GetOrderDTO) => void;

  /** Колбэк при ошибке */
  onError?: (error: Error) => void;

  /** Колбэк при завершении (успех или ошибка) */
  onSettled?: () => void;

  /** Роль пользователя для выбора правильного API */
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';

  /** ID заказа для режима обновления */
  orderId?: string;

  /** Пассажиры для обновления (только в режиме редактирования) */
  passengers?: Array<{
    customerId: string | null;
    firstName: string;
    lastName: string | null;
    isMainPassenger: boolean;
  }>;

  /** Нужно ли обновлять пассажиров отдельным запросом */
  shouldUpdatePassengers?: boolean;
}

/**
 * Результат хука создания/обновления моментального заказа
 */
export interface UseInstantOrderSubmitResult {
  /** Функция создания/обновления заказа */
  createOrder: (data: CreateInstantOrderRequest | CreateInstantOrderByPartnerRequest) => void;

  /** Состояние загрузки */
  isLoading: boolean;

  /** Ошибка */
  error: Error | null;

  /** Данные созданного/обновленного заказа */
  data: GetOrderDTO | null;

  /** Сброс состояния */
  reset: () => void;
}

/**
 * Хук для создания/обновления моментального заказа
 */
export function useInstantOrderSubmit(
  options: UseInstantOrderSubmitOptions = {}
): UseInstantOrderSubmitResult {
  const { 
    onSuccess, 
    onError, 
    onSettled, 
    userRole = 'operator', 
    orderId
  } = options;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateInstantOrderRequest | CreateInstantOrderByPartnerRequest) => {
      // Режим обновления
      if (orderId) {
        const updateData = convertToUpdateData(data);
        const updatedOrder = await OrdersApi.updateInstantOrder(orderId, updateData);

        // Обновляем пассажиров отдельным запросом (если переданы)
        if (options.shouldUpdatePassengers && options.passengers && options.passengers.length > 0) {
          await OrdersApi.updateOrderPassengers(orderId, options.passengers);
        }

        return updatedOrder;
      }

      // Для партнеров используем отдельный API
      if (userRole === 'partner') {
        return OrdersApi.createInstantOrderByPartner(data as CreateInstantOrderByPartnerRequest);
      }

      return OrdersApi.createInstantOrder(data as CreateInstantOrderRequest);
    },
    onSuccess: (data) => {
      toast.success(
        `✅ Заказ ${orderId ? 'обновлен' : 'создан'} успешно`,
        data
      );
      
      // Инвалидируем кэш для обновленного заказа
      if (orderId) {
        queryClient.invalidateQueries({
          queryKey: ['instant-order', orderId]
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
    onSettled,
  });

  return {
    createOrder: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data || null,
    reset: mutation.reset,
  };
}
