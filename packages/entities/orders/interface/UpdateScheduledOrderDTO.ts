import type { PaymentMethodType } from '@entities/orders/enums';
import type { OrderServiceDTO } from './OrderServiceDTO';
import type { PassengerDTO } from './PassengerDTO';

/**
 * Интерфейс для обновления запланированного заказа
 */
export interface UpdateScheduledOrderDTO {
  /** ID заказа для обновления */
  orderId: string;

  /** ID тарифа */
  tariffId: string;

  /** ID готового маршрута (опционально) */
  routeId?: string | null;

  /** ID начальной точки (опционально, если не используется routeId) */
  startLocationId?: string | null;

  /** ID конечной точки (опционально, если не используется routeId) */
  endLocationId?: string | null;

  /** Текстовый адрес начальной точки */
  startAddress: string;

  /** Текстовый адрес конечной точки */
  endAddress: string;

  /** Промежуточные точки (ID локаций) */
  additionalStops: string[];

  /** Дополнительные услуги */
  services: OrderServiceDTO[];

  /** Предварительная стоимость */
  initialPrice: number;

  /** Запланированное время */
  scheduledTime: string;

  /** Информация о пассажирах (без ID, так как это данные для обновления) */
  passengers: PassengerDTO[];

  /** Статус заказа */
  status: string;

  /** Подстатус заказа */
  subStatus: string;

  /** Описание заказа */
  description?: string | null;

  /** Номер рейса (прилёт) */
  airFlight?: string | null;

  /** Номер рейса (вылет) */
  flyReis?: string | null;

  /** Комментарии к заказу */
  notes?: string | null;

  /** Метод оплаты */
  paymentMethodType?: PaymentMethodType | null;

  /** Сумма водителя */
  driverPrice?: number | null;
}
