import type { NotificationType } from '../enums/NotificationType.enum';

export const NotificationTypeLabels: Record<NotificationType, string> = {
  OrderCreated: 'Заказ создан',
  OrderUpdated: 'Заказ изменён',
  OrderCancelled: 'Заказ отменён',
  OrderCompleted: 'Заказ завершён',

  RideRequest: 'Запрос на поездку',
  RideAccepted: 'Поездка принята',
  RideStarted: 'Поездка началась',
  RideCompleted: 'Поездка завершена',
  RideCancelled: 'Поездка отменена',
  RideUpdate: 'Обновление поездки',
  CancelRideRequest: 'Отмена запроса на поездку',

  PaymentReceived: 'Платёж получен',

  DriverHeading: 'Водитель в пути',
  DriverArrived: 'Водитель прибыл',
  DriverAssigned: 'Водитель назначен',
  DriverCancelled: 'Водитель отменил',
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
  return NotificationTypeLabels[type] ?? type;
};

export const NotificationTypeColors: Record<NotificationType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OrderCreated: 'default',
  OrderUpdated: 'secondary',
  OrderCancelled: 'destructive',
  OrderCompleted: 'default',

  RideRequest: 'outline',
  RideAccepted: 'default',
  RideStarted: 'default',
  RideCompleted: 'default',
  RideCancelled: 'destructive',
  RideUpdate: 'secondary',
  CancelRideRequest: 'destructive',

  PaymentReceived: 'default',

  DriverHeading: 'secondary',
  DriverArrived: 'default',
  DriverAssigned: 'default',
  DriverCancelled: 'destructive',
};

export const getNotificationTypeColor = (type: NotificationType) => {
  return NotificationTypeColors[type] ?? 'outline';
};
