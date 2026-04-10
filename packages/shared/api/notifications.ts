import { type NotificationType } from '@entities/notifications';
import { apiGet, apiPost, apiPut, apiDelete } from './client';

// Операторы поиска
type SearchOperator =
  | 'Equals'
  | 'NotEquals'
  | 'Contains'
  | 'NotContains'
  | 'StartsWith'
  | 'EndsWith'
  | 'IsEmpty'
  | 'IsNotEmpty';

// Операторы сравнения для дат
type DateOperator =
  | 'GreaterThan'
  | 'GreaterThanOrEqual'
  | 'Equal'
  | 'LessThanOrEqual'
  | 'LessThan';

// Поля для сортировки
type SortOrder = 'Asc' | 'Desc';

// Типы заказов
type OrderType = 'Unknown' | 'Instant' | 'Scheduled' | 'Partner' | 'Shuttle' | 'Subscription';

// Интерфейс уведомления
interface GetNotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  content?: string | null;
  orderId?: string | null;
  rideId?: string | null;
  isRead: boolean;
  orderType: OrderType;
  userId?: string;
  data: unknown | null;
  createdAt: string;
}

// Типы для API фильтров
interface NotificationFilters {
  // Пагинация (cursor-based)
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;

  // Поиск по полям
  type?: NotificationType[];
  title?: string;
  titleOp?: SearchOperator;
  content?: string;
  contentOp?: SearchOperator;
  userId?: string;
  orderId?: string;
  orderType?: OrderType[];
  rideId?: string;
  isRead?: boolean;
  createdAt?: string;
  createdAtOp?: DateOperator;

  // Полнотекстовый поиск
  'FTS.Plain'?: string;

  // Сортировка
  sortBy?: string;
  sortOrder?: SortOrder;
}

interface NotificationApiResponse {
  data: GetNotificationDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// DTO для создания уведомления
interface CreateNotificationDTO {
  type: NotificationType;
  title: string;
  content?: string | null;
  orderId?: string | null;
  rideId?: string | null;
  orderType?: OrderType;
  userId?: string;
}

// DTO для обновления уведомления
interface UpdateNotificationDTO {
  type?: NotificationType;
  title?: string;
  content?: string | null;
  orderId?: string | null;
  rideId?: string | null;
  orderType?: OrderType;
  isRead?: boolean;
}

export const notificationsApi = {
  // Получение списка уведомлений
  getNotifications: async (params?: NotificationFilters): Promise<NotificationApiResponse> => {
    const result = await apiGet<NotificationApiResponse>('/Notification', { params });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение моих уведомлений
  getMyNotifications: async (params?: NotificationFilters): Promise<NotificationApiResponse> => {
    const result = await apiGet<NotificationApiResponse>('/Notification/me', { params });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение уведомления по ID
  getNotificationById: async (id: string): Promise<GetNotificationDTO> => {
    const result = await apiGet<GetNotificationDTO>(`/Notification/${id}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Создание уведомления
  createNotification: async (data: CreateNotificationDTO): Promise<GetNotificationDTO> => {
    const result = await apiPost<GetNotificationDTO, CreateNotificationDTO>('/Notification', data);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Обновление уведомления
  updateNotification: async (id: string, data: UpdateNotificationDTO): Promise<GetNotificationDTO> => {
    const result = await apiPut<GetNotificationDTO, UpdateNotificationDTO>(`/Notification/${id}`, data);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Удаление уведомления
  deleteNotification: async (id: string): Promise<void> => {
    const result = await apiDelete(`/Notification/${id}`);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  // Отметить уведомления как прочитанные
  markAsRead: async (notificationIds: string[]): Promise<void> => {
    const result = await apiPost<void, string[]>('/Notification/read', notificationIds);

    if (result.error) {
      throw new Error(result.error.message);
    }
  },
};

export type { 
  NotificationFilters, 
  NotificationApiResponse, 
  GetNotificationDTO,
  CreateNotificationDTO,
  UpdateNotificationDTO,
  OrderType
};
