import { type NotificationType } from '@entities/notifications';
import { apiGet, apiPost, apiDelete } from './client';

// ─── Вспомогательные типы ───────────────────────────────────────────────────

type SearchOperator =
  | 'Equals'
  | 'NotEquals'
  | 'Contains'
  | 'NotContains'
  | 'StartsWith'
  | 'EndsWith'
  | 'IsEmpty'
  | 'IsNotEmpty';

type DateOperator =
  | 'GreaterThan'
  | 'GreaterThanOrEqual'
  | 'Equal'
  | 'LessThanOrEqual'
  | 'LessThan';

type SortOrder = 'Asc' | 'Desc';

export type OrderType =
  | 'Unknown'
  | 'Instant'
  | 'Scheduled'
  | 'Partner'
  | 'Shuttle'
  | 'Subscription';

// ─── DTO ────────────────────────────────────────────────────────────────────

export interface GetNotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  content?: string | null;
  orderId?: string | null;
  rideId?: string | null;
  isRead: boolean;
  orderType: OrderType;
  userId?: string;
  data: unknown;
  createdAt?: string;
}

export interface NotificationFilters {
  // Cursor-based пагинация
  first?: boolean;
  before?: string;
  after?: string;
  last?: boolean;
  size?: number;

  // Фильтры
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

export interface NotificationApiResponse {
  data: GetNotificationDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface CreateNotificationDTO {
  type: NotificationType;
  title: string;
  content?: string | null;
  orderId?: string | null;
  rideId?: string | null;
  orderType?: OrderType;
  userId?: string;
  data?: unknown;
}

export interface BroadcastToUserDTO {
  type: NotificationType;
  title: string;
  content?: string | null;
  data?: unknown;
}

export interface BroadcastToUsersDTO extends BroadcastToUserDTO {
  userIds: string[];
}

/** Схема поля data для конкретного типа уведомления (из /Notification/.doc/{type}) */
export interface NotificationDocDTO {
  type: NotificationType;
  description: string;
  dataSchema: Record<string, unknown>;
  example?: unknown;
}

// ─── API ────────────────────────────────────────────────────────────────────

export const notificationsApi = {
  // GET /Notification — все уведомления (admin)
  getNotifications: async (params?: NotificationFilters): Promise<NotificationApiResponse> => {
    const result = await apiGet<NotificationApiResponse>('/Notification', { params });

    if (result.error) throw new Error(result.error.message);

    return result.data!;
  },

  // POST /Notification — создать уведомление
  createNotification: async (data: CreateNotificationDTO): Promise<GetNotificationDTO> => {
    const result = await apiPost<GetNotificationDTO, CreateNotificationDTO>('/Notification', data);

    if (result.error) throw new Error(result.error.message);

    return result.data!;
  },

  // GET /Notification/me — мои уведомления
  getMyNotifications: async (params?: NotificationFilters): Promise<NotificationApiResponse> => {
    const result = await apiGet<NotificationApiResponse>('/Notification/me', { params });

    if (result.error) throw new Error(result.error.message);

    return result.data!;
  },

  // GET /Notification/{uuid}
  getNotificationById: async (id: string): Promise<GetNotificationDTO> => {
    const result = await apiGet<GetNotificationDTO>(`/Notification/${id}`);

    if (result.error) throw new Error(result.error.message);

    return result.data!;
  },

  // DELETE /Notification/{uuid}
  deleteNotification: async (id: string): Promise<void> => {
    const result = await apiDelete(`/Notification/${id}`);

    if (result.error) throw new Error(result.error.message);
  },

  // POST /Notification/read — отметить прочитанными (массив id)
  markAsRead: async (notificationIds: string[]): Promise<void> => {
    const result = await apiPost<void, string[]>('/Notification/read', notificationIds);

    if (result.error) throw new Error(result.error.message);
  },

  // GET /Notification/.doc/{type} — схема поля data для типа
  getNotificationDoc: async (type: NotificationType): Promise<NotificationDocDTO> => {
    const result = await apiGet<NotificationDocDTO>(`/Notification/.doc/${type}`);

    if (result.error) throw new Error(result.error.message);

    return result.data!;
  },

  // POST /Notification/broadcast/user/{uuid}
  broadcastToUser: async (userId: string, data: BroadcastToUserDTO): Promise<void> => {
    const result = await apiPost<void, BroadcastToUserDTO>(
      `/Notification/broadcast/user/${userId}`,
      data,
    );

    if (result.error) throw new Error(result.error.message);
  },

  // POST /Notification/broadcast/users
  broadcastToUsers: async (data: BroadcastToUsersDTO): Promise<void> => {
    const result = await apiPost<void, BroadcastToUsersDTO>('/Notification/broadcast/users', data);

    if (result.error) throw new Error(result.error.message);
  },

  // POST /Notification/broadcast/role/{role}
  broadcastToRole: async (role: string, data: BroadcastToUserDTO): Promise<void> => {
    const result = await apiPost<void, BroadcastToUserDTO>(
      `/Notification/broadcast/role/${role}`,
      data,
    );

    if (result.error) throw new Error(result.error.message);
  },
};
