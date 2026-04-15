import type { NotificationType } from '../enums';

/**
 * Единый интерфейс уведомления от /hubs/WSClient — endpoint New.
 * Все типы уведомлений приходят через одно событие.
 * Поле data содержит тип-специфичные данные (any, т.к. бэкенд возвращает разные структуры).
 */
export interface WSNotificationDTO {
  id?: string;
  type?: NotificationType;
  title: string;
  content?: string | null;
  orderId?: string | null;
  rideId?: string | null;
  orderType?: 'Instant' | 'Scheduled';
  data?: any;
}