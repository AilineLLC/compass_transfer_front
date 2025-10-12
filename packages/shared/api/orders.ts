import type { OrderStatus } from '@entities/orders/enums/OrderStatus.enum';
import type { OrderSubStatus } from '@entities/orders/enums/OrderSubStatus.enum';
import type { OrderType } from '@entities/orders/enums/OrderType.enum';
import type { GetOrderDTO } from '@entities/orders/interface/GetOrderDTO';
import { apiGet, apiDelete, apiPost, apiPut } from './client';

export interface OrderFilters {
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;
  orderNumber?: string;
  orderNumberOp?: 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';
  type?: OrderType[];
  status?: OrderStatus[];
  subStatus?: OrderSubStatus[];
  creatorId?: string;
  createdAt?: string;
  createdAtOp?: 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';
  completedAt?: string;
  completedAtOp?: 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';
  scheduledTime?: string;
  scheduledTimeOp?: 'GreaterThan' | 'GreaterThanOrEqual' | 'Equal' | 'LessThanOrEqual' | 'LessThan';
  services?: string[];
  customerId?: string;
  airFlight?: string;
  airFlightOp?: 'Equals' | 'NotEquals' | 'Contains' | 'NotContains' | 'StartsWith' | 'EndsWith' | 'IsEmpty' | 'IsNotEmpty';
  flyReis?: string;
  flyReisOp?: 'Equals' | 'NotEquals' | 'Contains' | 'NotContains' | 'StartsWith' | 'EndsWith' | 'IsEmpty' | 'IsNotEmpty';
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
}

export interface OrderApiResponse {
  data: GetOrderDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface OrderStatsResponse {
  pending: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  expired: number;
}

export interface PotentialDriverResponse {
  id: string;
  fullName: string;
  rank: number;
  allTrue: boolean;
  isOnline: boolean;
  activeCarStatus: boolean;
  activeCarPassengerCapacity: boolean;
  activeCarServiceClass: boolean;
  distancePredicate: boolean;
  driverMinRating: boolean;
  driverHasNoActiveRides: boolean;
  driverHasNotBeenRequested: boolean;
  driverQueuePresent: boolean;
}

export const ordersApi = {
  // Получение списка заказов
  getOrders: async (filters: OrderFilters = {}): Promise<OrderApiResponse> => {
    const result = await apiGet<OrderApiResponse>('/Order', { params: filters });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение статистики заказов
  getOrderStats: async (): Promise<OrderStatsResponse> => {
    const result = await apiGet<OrderStatsResponse>('/Order/stats');

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение статистики заказов партнера (созданных им)
  getMyCreatorOrderStats: async (): Promise<OrderStatsResponse> => {
    const result = await apiGet<OrderStatsResponse>('/Order/my/creator/stats');

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение заказов созданных партнером
  getMyCreatorOrders: async (filters: OrderFilters = {}): Promise<OrderApiResponse> => {
    const result = await apiGet<OrderApiResponse>('/Order/my/creator', { params: filters });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Удаление заказа
  deleteOrder: async (orderId: string): Promise<void> => {
    const result = await apiDelete(`/Order/${orderId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  // Получение заказа по ID
  getOrderById: async (orderId: string): Promise<GetOrderDTO> => {
    const result = await apiGet<GetOrderDTO>(`/Order/${orderId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },
};

// Сервис для работы с заказами (для новых хуков)
export const orderService = {
  // Получение мгновенного заказа
  getInstantOrder: async (id: string): Promise<GetOrderDTO> => {
    const result = await apiGet<GetOrderDTO>(`/Order/instant/${id}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение запланированного заказа
  getScheduledOrder: async (id: string): Promise<GetOrderDTO> => {
    const result = await apiGet<GetOrderDTO>(`/Order/scheduled/${id}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Создание мгновенного заказа
  createInstantOrder: async (data: unknown): Promise<{ id: string }> => {
    const result = await apiPost<{ id: string }>('/Order/instant', data as Record<string, unknown>);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Обновление мгновенного заказа
  updateInstantOrder: async (id: string, data: unknown): Promise<{ id: string }> => {
    const result = await apiPut<{ id: string }>(`/Order/instant/${id}`, data as Record<string, unknown>);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Создание запланированного заказа
  createScheduledOrder: async (data: unknown): Promise<{ id: string }> => {
    const result = await apiPost<{ id: string }>('/Order/scheduled', data as Record<string, unknown>);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Обновление запланированного заказа
  updateScheduledOrder: async (id: string, data: unknown): Promise<{ id: string }> => {
    const result = await apiPut<{ id: string }>(`/Order/scheduled/${id}`, data as Record<string, unknown>);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение потенциальных водителей для заказа
  getPotentialDrivers: async (orderId: string): Promise<PotentialDriverResponse[]> => {
    const result = await apiGet<PotentialDriverResponse[]>(`/Order/${orderId}/PotentialDrivers`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Создание мгновенного заказа через терминал
  createInstantOrderByTerminal: async (data: unknown): Promise<{ id: string }> => {
    const result = await apiPost<{ id: string }>('/Order/instant/by-terminal', data as Record<string, unknown>);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Создание поездки для запланированного заказа
  createScheduledRide: async (orderId: string, data: unknown): Promise<{ id: string }> => {
    const result = await apiPost<{ id: string }>(`/Order/scheduled/${orderId}/ride`, data as Record<string, unknown>);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение заказа по ID
  getOrderById: async (orderId: string): Promise<GetOrderDTO> => {
    const result = await apiGet<GetOrderDTO>(`/Order/${orderId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },
};

// Интерфейсы для работы водителя с заказами
export interface AcceptOrderResponse {
  orderId: string | null;
  driverId: string;
  carId: string;
  id: string;
  status: 'Requested' | 'Searching' | 'Accepted' | 'Arrived' | 'InProgress' | 'Completed' | 'Cancelled';
  driverArrivedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  passengerWaitingTime: string | null;
  distance: number | null;
  duration: string | null;
  waypoints: Array<{
    locationId: string;
    location: {
      id: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    };
    arrivalTime: string | null;
    departureTime: string | null;
  }>;
}

// API методы для водителя
export const driverOrderApi = {
  // Принятие мгновенного заказа водителем
  acceptInstantOrder: async (orderId: string): Promise<AcceptOrderResponse> => {
    const result = await apiPost<AcceptOrderResponse>(`/Order/instant/${orderId}/accept-by-driver`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },
};

// API методы для водителя - активные заказы
export const driverActiveOrdersApi = {
  // Получение активных заказов водителя
  getMyActiveOrders: async (): Promise<OrderApiResponse> => {
    const params = new URLSearchParams();
    
    params.append('Status', 'InProgress');
    params.append('Status', 'Scheduled');
    params.append('SortBy', 'CreatedAt');
    params.append('SortOrder', 'Desc');
    params.append('Size', '10');

    const result = await apiGet<OrderApiResponse>(`/Order/my/participant?${params.toString()}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data || { data: [], totalCount: 0, pageSize: 10, hasPrevious: false, hasNext: false };
  },
};

export type { GetOrderDTO };
