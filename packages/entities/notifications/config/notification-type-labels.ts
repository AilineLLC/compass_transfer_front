import type { NotificationType } from '../enums/NotificationType.enum';

export const NotificationTypeLabels: Record<NotificationType, string> = {
  OrderCreated: 'Заказ создан',
  OrderConfirmed: 'Заказ подтверждён',
  OrderCancelled: 'Заказ отменён',
  OrderCompleted: 'Заказ завершён',

  RideRequest: 'Запрос поездки',
  RideAccepted: 'Поездка принята',
  RideRejected: 'Поездка отклонена',
  RideStarted: 'Поездка начата',
  RideCompleted: 'Поездка завершена',
  RideCancelled: 'Поездка отменена',

  DriverHeading: 'Водитель в пути',
  DriverArrived: 'Водитель прибыл',
  DriverCancelled: 'Водитель отменил',

  Payment: 'Платёж',
  PaymentReceived: 'Платёж получен',
  PaymentFailed: 'Ошибка платежа',
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
  return NotificationTypeLabels[type] ?? 'Уведомление';
};

export const NotificationTypeColors: Record<NotificationType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OrderCreated: 'default',
  OrderConfirmed: 'default',
  OrderCancelled: 'destructive',
  OrderCompleted: 'default',

  RideRequest: 'outline',
  RideAccepted: 'default',
  RideRejected: 'destructive',
  RideStarted: 'default',
  RideCompleted: 'default',
  RideCancelled: 'destructive',

  DriverHeading: 'secondary',
  DriverArrived: 'default',
  DriverCancelled: 'destructive',

  Payment: 'outline',
  PaymentReceived: 'default',
  PaymentFailed: 'destructive',
};

export const getNotificationTypeColor = (type: NotificationType) => {
  return NotificationTypeColors[type] ?? 'outline';
};
