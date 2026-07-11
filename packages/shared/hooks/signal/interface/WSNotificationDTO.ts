import type { NotificationType } from '@entities/notifications/enums/NotificationType.enum';

export type OrderType = 'Unknown' | 'Instant' | 'Scheduled' | 'Partner' | 'Shuttle' | 'Subscription';

export interface WSNotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  content?: string | null;
  orderId?: string | null;
  rideId?: string | null;
  orderType?: OrderType;
  isRead: boolean;
  data: unknown;
  createdAt: string;
}
