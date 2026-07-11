/**
 * `OrderCreated` = Заказ создан<br>`OrderUpdated` = Заказ изменён<br>`OrderCancelled` = Заказ отменен<br>`OrderCompleted` = Заказ завершен<br>`RideRequest` = Запрос на поездку<br>`RideAccepted` = Поездка принята<br>`RideStarted` = Поездка началась<br>`RideCompleted` = Поездка завершена<br>`RideCancelled` = Поездка отменена<br>`RideUpdate` = Обновление информации о поездке<br>`CancelRideRequest` = Отмена запроса на поездку<br>`PaymentReceived` = Платеж получен<br>`DriverHeading` = Водитель в пути<br>`DriverArrived` = Водитель прибыл<br>`DriverAssigned` = Водитель назначен<br>`DriverCancelled` = Водитель отменил
 * @enum
 */
export enum NotificationType {
  OrderCreated = 'OrderCreated',
  OrderUpdated = 'OrderUpdated',
  OrderCancelled = 'OrderCancelled',
  OrderCompleted = 'OrderCompleted',
  RideRequest = 'RideRequest',
  RideAccepted = 'RideAccepted',
  RideStarted = 'RideStarted',
  RideCompleted = 'RideCompleted',
  RideCancelled = 'RideCancelled',
  RideUpdate = 'RideUpdate',
  CancelRideRequest = 'CancelRideRequest',
  PaymentReceived = 'PaymentReceived',
  DriverHeading = 'DriverHeading',
  DriverArrived = 'DriverArrived',
  DriverAssigned = 'DriverAssigned',
  DriverCancelled = 'DriverCancelled',
}

export const NotificationTypeValues = Object.values(NotificationType);
