export enum NotificationType {
  // Заказы
  OrderCreated = 'OrderCreated',
  OrderUpdated = 'OrderUpdated',
  OrderCancelled = 'OrderCancelled',
  OrderCompleted = 'OrderCompleted',

  // Поездки
  RideRequest = 'RideRequest',
  RideAccepted = 'RideAccepted',
  RideStarted = 'RideStarted',
  RideCompleted = 'RideCompleted',
  RideCancelled = 'RideCancelled',
  RideUpdate = 'RideUpdate',
  CancelRideRequest = 'CancelRideRequest',

  // Платежи
  PaymentReceived = 'PaymentReceived',

  // Водители
  DriverHeading = 'DriverHeading',
  DriverArrived = 'DriverArrived',
  DriverAssigned = 'DriverAssigned',
  DriverCancelled = 'DriverCancelled',
}

export const NotificationTypeValues = Object.values(NotificationType);

export const isValidNotificationType = (value: string): value is NotificationType => {
  return NotificationTypeValues.includes(value as NotificationType);
};
