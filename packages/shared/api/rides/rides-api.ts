import type {
  PaginatedRidesResponse,
  GetRideDTO,
  ScheduledRidesResponse,
  ScheduledRidesParams
} from '@entities/rides/interface';
import apiClient from '../client';

// Интерфейс для ответа API с правильной структурой пагинации
interface RidesApiResponse {
  data: GetRideDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
  startCursor?: string;
  endCursor?: string;
}

/**
 * Параметры для получения поездок пользователя
 */
export interface GetMyRidesParams {
  // Пагинация
  First?: number;
  Before?: string;
  After?: string;
  Last?: number;
  Size?: number;

  // Фильтры
  Status?: string;
  DriverId?: string;
  OrderId?: string;

  // Поиск
  'FTS.Plain'?: string;
  'FTS.Query'?: string;

  // Сортировка
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

/**
 * API для работы с поездками
 */
export const ridesApi = {
  /**
   * Получить поездки текущего пользователя
   */
  async getMyRides(params?: GetMyRidesParams): Promise<PaginatedRidesResponse> {
    const result = await apiClient.get<PaginatedRidesResponse>('/Ride/my', {
      params,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) {
      throw new Error('Нет данных в ответе API');
    }

    return result.data;
  },

  /**
   * Получить конкретную поездку по ID
   */
  async getRide(rideId: string): Promise<GetRideDTO> {
    const result = await apiClient.get<GetRideDTO>(`/Ride/${rideId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) {
      throw new Error('Нет данных в ответе API');
    }

    return result.data;
  },


  async getRideByOrderId(orderId: string): Promise<GetRideDTO> {
    const result = await apiClient.get<GetRideDTO>(`/Ride/for-order/${orderId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) {
      throw new Error('Нет данных в ответе API');
    }

    return result.data;
  },

  /**
   * Получить поездки конкретного пользователя
   */
  async getUserRides(userId: string, params?: GetMyRidesParams): Promise<RidesApiResponse> {
    // Используем общий эндпоинт /Ride с фильтрацией по DriverId
    const result = await apiClient.get<RidesApiResponse>('/Ride', {
      params: {
        ...params,
        DriverId: userId, // Фильтруем по водителю
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) {
      throw new Error('Нет данных в ответе API');
    }

    return result.data;
  },

  /**
   * Получить назначенные поездки водителя (активные и запланированные)
   */
  async getMyAssignedRides(params?: ScheduledRidesParams): Promise<ScheduledRidesResponse> {
    const result = await apiClient.get<ScheduledRidesResponse>('/Ride/my/assigned', {
      params,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) {
      throw new Error('Нет данных в ответе API');
    }

    return result.data;
  },

  /**
   * Водитель направляется к клиенту
   */
  async driverHeadingToClient(rideId: string): Promise<void> {
    const result = await apiClient.post(`/Ride/${rideId}/status/driver-heading-to-client`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  /**
   * Водитель прибыл на место посадки
   */
  async driverArrived(rideId: string): Promise<void> {
    const result = await apiClient.post(`/Ride/${rideId}/status/driver-arrived`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  /**
   * Клиент сел в машину, поездка началась
   */
  async rideStarted(rideId: string): Promise<void> {
    const result = await apiClient.post(`/Ride/${rideId}/status/ride-started`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  /**
   * Поездка завершена, клиент доставлен
   */
  async rideFinished(rideId: string): Promise<void> {
    const result = await apiClient.post(`/Ride/${rideId}/status/ride-finished`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  /**
   * Поездка отменена
   */
  async rideCancelled(rideId: string): Promise<void> {
    const result = await apiClient.post(`/Ride/${rideId}/status/ride-cancelled`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  /**
   * Подтверждение получения наличных от пассажира
   */
  async markCashReceived(rideId: string): Promise<void> {
    const result = await apiClient.put(`/Ride/${rideId}/cash-received`, true);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  /**
   * Принятие запланированной поездки водителем
   */
  async acceptScheduledRide(rideId: string): Promise<void> {
    const result = await apiClient.post(`/Ride/${rideId}/accept-by-driver`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  /**
   * Водитель готов к поездке (вызывается через 90 минут после RideRequestNotification)
   */
  async driverReady(rideId: string): Promise<void> {
    const result = await apiClient.post(`/Ride/${rideId}/status/driver-ready`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },
};
