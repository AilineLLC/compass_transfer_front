import type { WSNotificationDTO } from '@shared/hooks/signal/interface';

/**
 * Единственное событие — New — приходит с payload WSNotificationDTO.
 * data: any — бэкенд возвращает разные структуры в зависимости от type.
 */
export type SignalREventData = WSNotificationDTO;

/**
 * Мапинг событий к их типам данных.
 * Бэкенд поддерживает только один endpoint: /hubs/WSClient/New.
 */
export interface SignalREventMap {
  New: WSNotificationDTO;
}

/**
 * Generic callback функция для типизированных событий
 */
export type SignalRCallback<T = SignalREventData> = (data: T) => void;

/**
 * Типизированный callback для конкретного события
 */
export type TypedSignalRCallback<K extends keyof SignalREventMap> = SignalRCallback<
  SignalREventMap[K]
>;

/**
 * Generic интерфейс для обработчиков событий
 */
export interface SignalREventHandler {
  <K extends keyof SignalREventMap>(event: K, callback: TypedSignalRCallback<K>): void;
  (event: string, callback: SignalRCallback): void; // Fallback
}


export enum NotificationType {
  Unknown = 'Unknown',
  OrderCreated = 'OrderCreated',
  OrderUpdated = 'OrderUpdated',
  OrderConfirmed = 'OrderConfirmed',
  OrderCancelled = 'OrderCancelled',
  OrderCompleted = 'OrderCompleted',
  RideRequest = 'RideRequest',
  RideAccepted = 'RideAccepted',
  RideRejected = 'RideRejected',
  RideStarted = 'RideStarted',
  RideCompleted = 'RideCompleted',
  RideCancelled = 'RideCancelled',
  RideUpdate = 'RideUpdate',
  Payment = 'Payment',
  PaymentReceived = 'PaymentReceived',
  PaymentFailed = 'PaymentFailed',
  PaymentRefunded = 'PaymentRefunded',
  DriverHeading = 'DriverHeading',
  DriverArrived = 'DriverArrived',
  DriverAssigned = 'DriverAssigned',
  DriverCancelled = 'DriverCancelled',
  DriverNearby = 'DriverNearby',
  System = 'System',
  SystemMessage = 'SystemMessage',
  Maintenance = 'Maintenance',
  Promo = 'Promo',
  PromoOffer = 'PromoOffer',
  Verification = 'Verification',
  Chat = 'Chat',
}