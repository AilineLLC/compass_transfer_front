import type { GetNotificationDTO } from '@shared/api/notifications';
/**
 * Приоритет состояний уведомлений (чем больше число, тем выше приоритет)
 */
const NOTIFICATION_STATE_PRIORITY: Record<string, number> = {
  // Начальные состояния
  'RideRequest': 1,
  'OrderCreated': 1,

  // Активные состояния
  'RideAccepted': 2,
  'DriverHeading': 3,
  'DriverArrived': 4,
  'RideStarted': 5,
  'OrderConfirmed': 5,

  // Финальные состояния
  'RideCompleted': 10,
  'OrderCompleted': 10,

  // Отмены и отклонения
  'RideCancelled': 9,
  'OrderCancelled': 9,
  'DriverCancelled': 8,
  'RideRejected': 7,

  // Платежи (всегда показываем, не дедуплицируем)
  'Payment': 100,
  'PaymentReceived': 100,
  'PaymentFailed': 100,
};

/**
 * Группирует уведомления по orderId и возвращает только самое актуальное для каждого заказа
 */
export function deduplicateNotificationsByOrder(notifications: GetNotificationDTO[]): GetNotificationDTO[] {
  // Группируем по orderId
  const groupedByOrder = new Map<string, GetNotificationDTO[]>();
  const systemNotifications: GetNotificationDTO[] = [];

  notifications.forEach(notification => {
    // Системные уведомления без orderId показываем всегда
    if (!notification.orderId || NOTIFICATION_STATE_PRIORITY[notification.type] >= 100) {
      systemNotifications.push(notification);

      return;
    }
    if (!groupedByOrder.has(notification.orderId)) {
      groupedByOrder.set(notification.orderId, []);
    }
    groupedByOrder.get(notification.orderId)!.push(notification);
  });
  // Для каждого заказа выбираем самое актуальное уведомление
  const deduplicatedNotifications: GetNotificationDTO[] = [];

  groupedByOrder.forEach(orderNotifications => {
    // Сортируем по приоритету состояния (по убыванию)
    const sortedNotifications = orderNotifications.sort((a, b) => {
      const priorityA = NOTIFICATION_STATE_PRIORITY[a.type] || 0;
      const priorityB = NOTIFICATION_STATE_PRIORITY[b.type] || 0;

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // По убыванию приоритета
      }

      // Если приоритет одинаковый, сортируем по времени создания (новые первые)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    // Берем самое актуальное уведомление
    deduplicatedNotifications.push(sortedNotifications[0]);
  });
  // Добавляем системные уведомления
  deduplicatedNotifications.push(...systemNotifications);

  // Сортируем итоговый список по времени создания (новые первые)
  return deduplicatedNotifications.sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}
/**
 * Проверяет, является ли уведомление системным (не связанным с конкретным заказом)
 */
export function isSystemNotification(notification: GetNotificationDTO): boolean {
  return !notification.orderId || NOTIFICATION_STATE_PRIORITY[notification.type] >= 100;
}
/**
 * Получает приоритет состояния уведомления
 */
export function getNotificationStatePriority(type: string): number {
  return NOTIFICATION_STATE_PRIORITY[type] || 0;
}
