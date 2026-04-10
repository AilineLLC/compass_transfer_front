export enum NotificationType {
  OrderCreated = 'OrderCreated',
  OrderConfirmed = 'OrderConfirmed',
  OrderCancelled = 'OrderCancelled',
  OrderCompleted = 'OrderCompleted',

  RideRequest = 'RideRequest',
  RideAccepted = 'RideAccepted',
  RideRejected = 'RideRejected',
  RideStarted = 'RideStarted',
  RideCompleted = 'RideCompleted',
  RideCancelled = 'RideCancelled',

  DriverHeading = 'DriverHeading',
  DriverArrived = 'DriverArrived',
  DriverCancelled = 'DriverCancelled',

  Payment = 'Payment',
  PaymentReceived = 'PaymentReceived',
  PaymentFailed = 'PaymentFailed',
}

export const NotificationTypeValues = Object.values(NotificationType);

export const isValidNotificationType = (value: string): value is NotificationType => {
  return NotificationTypeValues.includes(value as NotificationType);
};

export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.OrderCreated]: 'Заказ создан',
  [NotificationType.OrderConfirmed]: 'Заказ подтверждён',
  [NotificationType.OrderCancelled]: 'Заказ отменён',
  [NotificationType.OrderCompleted]: 'Заказ завершён',

  [NotificationType.RideRequest]: 'Запрос поездки',
  [NotificationType.RideAccepted]: 'Поездка принята',
  [NotificationType.RideRejected]: 'Поездка отклонена',
  [NotificationType.RideStarted]: 'Поездка начата',
  [NotificationType.RideCompleted]: 'Поездка завершена',
  [NotificationType.RideCancelled]: 'Поездка отменена',

  [NotificationType.DriverHeading]: 'Водитель в пути',
  [NotificationType.DriverArrived]: 'Водитель прибыл',
  [NotificationType.DriverCancelled]: 'Водитель отменил',

  [NotificationType.Payment]: 'Платёж',
  [NotificationType.PaymentReceived]: 'Платёж получен',
  [NotificationType.PaymentFailed]: 'Ошибка платежа',
};
