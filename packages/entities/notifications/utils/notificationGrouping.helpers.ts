import type { GetNotificationDTO } from '@shared/api/notifications';

const NOTIFICATION_STATE_PRIORITY: Record<string, number> = {
  // Начальные состояния
  RideRequest: 1,
  OrderCreated: 1,

  // Активные состояния
  RideAccepted: 2,
  DriverAssigned: 3,
  DriverArrived: 4,
  DriverHeading: 4,
  RideStarted: 5,
  OrderUpdated: 5,

  // Финальные состояния
  RideCompleted: 10,
  OrderCompleted: 10,

  // Отмены
  RideCancelled: 9,
  OrderCancelled: 9,
  DriverCancelled: 8,
  CancelRideRequest: 7,

  // Платежи и обновления (всегда показываем)
  PaymentReceived: 100,
  RideUpdate: 100,
};

export function deduplicateNotificationsByOrder(notifications: GetNotificationDTO[]): GetNotificationDTO[] {
  const groupedByOrder = new Map<string, GetNotificationDTO[]>();
  const systemNotifications: GetNotificationDTO[] = [];

  notifications.forEach(notification => {
    if (!notification.orderId || NOTIFICATION_STATE_PRIORITY[notification.type] >= 100) {
      systemNotifications.push(notification);

      return;
    }
    if (!groupedByOrder.has(notification.orderId)) {
      groupedByOrder.set(notification.orderId, []);
    }
    groupedByOrder.get(notification.orderId)!.push(notification);
  });

  const deduplicatedNotifications: GetNotificationDTO[] = [];

  groupedByOrder.forEach(orderNotifications => {
    const sorted = orderNotifications.sort((a, b) => {
      const pa = NOTIFICATION_STATE_PRIORITY[a.type] || 0;
      const pb = NOTIFICATION_STATE_PRIORITY[b.type] || 0;

      if (pa !== pb) return pb - pa;

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    deduplicatedNotifications.push(sorted[0]);
  });

  deduplicatedNotifications.push(...systemNotifications);

  return deduplicatedNotifications.sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );
}

export function isSystemNotification(notification: GetNotificationDTO): boolean {
  return !notification.orderId || NOTIFICATION_STATE_PRIORITY[notification.type] >= 100;
}

export function getNotificationStatePriority(type: string): number {
  return NOTIFICATION_STATE_PRIORITY[type] || 0;
}
