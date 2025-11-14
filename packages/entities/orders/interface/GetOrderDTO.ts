import type { OrderType, OrderStatus, OrderSubStatus } from '@entities/orders/enums';
import type { GetRideDTO } from '@entities/rides/interface/GetRideDTO';
import type { GetOrderServiceDTO } from './GetOrderServiceDTO';
import type { GetPassengerDTO } from './GetPassengerDTO';

/**
 * Интерфейс для получения полной информации о заказе
 * @interface GetOrderDTO
 */
export interface GetOrderDTO {
  /**
   * Идентификатор заказа
   */
  id: string;

  /**
   * Номер заказа (integer от backend, конвертируется в base36 string для отображения)
   */
  orderNumber: number;

  /**
   * Тип заказа
   */
  type: OrderType;

  /**
   * Статус заказа
   */
  status: OrderStatus;

  /**
   * Подстатус заказа
   */
  subStatus?: OrderSubStatus;

  /**
   * Идентификатор тарифа
   */
  tariffId?: string | null;

  /**
   * Создатель заказа
   */
  creatorId: string;

  /**
   * Предварительная расчетная стоимость (сом)
   */
  initialPrice: number;

  /**
   * Итоговая стоимость заказа (сом)
   */
  finalPrice?: number | null;

  /**
   * Время создания заказа
   */
  createdAt: string;

  /**
   * Время фактического завершения заказа
   */
  completedAt?: string | null;

  /**
   * Использованный шаблон маршрута (если есть)
   */
  routeId?: string | null;

  /**
   * Начальная точка
   */
  startLocationId: string;

  /**
   * Конечная точка
   */
  endLocationId: string;

  /**
   * Промежуточные точки
   */
  additionalStops: string[];

  /**
   * Дополнительные услуги, включенные в заказ
   */
  services: GetOrderServiceDTO[];

  /**
   * Информация о пассажирах в заказе
   */
  passengers: GetPassengerDTO[];

  /**
   * Связанные поездки
   */
  rides?: GetRideDTO[];

  /**
   * Запланированное время выполнения (для предзаказов)
   */
  scheduledTime?: string | null;

  /**
   * Описание
   */
  description?: string | null;

  /**
   * Номер рейса (прилет)
   */
  airFlight?: string | null;

  /**
   * Номер рейса (вылет)
   */
  flyReis?: string | null;

  /**
   * Комментарии к заказу
   */
  notes?: string | null;

  /**
   * Доход водителя с поездки
   */
  driverProfit?: number | null;
}
