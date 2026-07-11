import type { WSNotificationDTO } from '@shared/hooks/signal/interface/WSNotificationDTO';
import type { ChatMessageDTO } from '@entities/chat/interface';

export type { WSNotificationDTO };

export type SignalREventData = WSNotificationDTO | Record<string, unknown>;

/** Обёртка уведомления для событий чата (data — само сообщение чата) */
export interface WSChatMessageEventDTO extends Omit<WSNotificationDTO, 'data' | 'type'> {
  type: 'ChatMessageNew' | 'ChatMessageUpdated' | 'ChatMessageDeleted';
  data: ChatMessageDTO;
}

/**
 * Все события SignalR. 'New' — единственный event от сервера.
 * Остальные ключи — это type из WSNotificationDTO, диспатчатся внутри SignalRProvider.
 */
export interface SignalREventMap {
  New: WSNotificationDTO;
  // Точечные подписки по типу уведомления
  OrderCreated: WSNotificationDTO;
  OrderUpdated: WSNotificationDTO;
  OrderCancelled: WSNotificationDTO;
  OrderCompleted: WSNotificationDTO;
  RideRequest: WSNotificationDTO;
  RideAccepted: WSNotificationDTO;
  RideStarted: WSNotificationDTO;
  RideCompleted: WSNotificationDTO;
  RideCancelled: WSNotificationDTO;
  RideUpdate: WSNotificationDTO;
  CancelRideRequest: WSNotificationDTO;
  PaymentReceived: WSNotificationDTO;
  DriverHeading: WSNotificationDTO;
  DriverArrived: WSNotificationDTO;
  DriverAssigned: WSNotificationDTO;
  DriverCancelled: WSNotificationDTO;
  ChatMessageNew: WSChatMessageEventDTO;
  ChatMessageUpdated: WSChatMessageEventDTO;
  ChatMessageDeleted: WSChatMessageEventDTO;
}

export type SignalRCallback<T = SignalREventData> = (data: T) => void;

export type TypedSignalRCallback<K extends keyof SignalREventMap> = SignalRCallback<SignalREventMap[K]>;

export interface SignalREventHandler {
  <K extends keyof SignalREventMap>(event: K, callback: TypedSignalRCallback<K>): void;
  (event: string, callback: SignalRCallback): void;
}
