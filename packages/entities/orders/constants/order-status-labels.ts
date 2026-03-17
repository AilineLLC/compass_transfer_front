import type { OrderStatus } from '../enums/OrderStatus.enum';
import type { OrderSubStatus } from '../enums/OrderSubStatus.enum';
import type { OrderType } from '../enums/OrderType.enum';

// Переводы для типов заказов
export const orderTypeLabels: Record<OrderType, string> = {
  Unknown: 'Неизвестно',
  Instant: 'Мгновенный',
  Scheduled: 'Предварительный',
  Partner: 'Партнерский',
  Shuttle: 'Шаттл',
  Subscription: 'Подписка',
};

// Переводы для статусов заказов
export const orderStatusLabels: Record<OrderStatus, string> = {
  Pending: 'Ожидание',
  Scheduled: 'Предварительный',
  InProgress: 'Текущие',
  Completed: 'Выполнен',
  Cancelled: 'Отменен',
  Expired: 'Просрочен',
};

// Переводы для подстатусов заказов
export const orderSubStatusLabels: Record<OrderSubStatus, string> = {
  SearchingDriver: 'Поиск водителя',
  DriverAssigned: 'Водитель назначен',
  DriverReady: 'Водитель готов',
  DriverHeading: 'Водитель едет',
  DriverArrived: 'Водитель прибыл',
  RideStarted: 'Поездка началась',
  RideFinished: 'Поездка завершена',
  PaymentPending: 'Ожидание оплаты',
  PaymentCompleted: 'Оплата завершена',
  ReviewPending: 'Ожидание отзыва',
  CancelledByClient: 'Отменен клиентом',
  CancelledByDriver: 'Отменен водителем',
  CancelledBySystem: 'Отменен системой',
  CancelledByOperator: 'Отменен оператором',
};

// Цвета для статусов заказов
export const orderStatusColors: Record<OrderStatus, string> = {
  Pending: 'default',
  Scheduled: 'secondary',
  InProgress: 'default',
  Completed: 'default',
  Cancelled: 'destructive',
  Expired: 'destructive',
};

// Цвета для карточек статистики
export const orderStatsColors = {
  pending: 'bg-yellow-50 border-yellow-300 text-yellow-800 border-2',
  scheduled: 'bg-blue-50 border-blue-300 text-blue-800 border-2',
  inProgress: 'bg-green-50 border-green-300 text-green-800 border-2',
  completed: 'bg-emerald-50 border-emerald-300 text-emerald-800 border-2',
  cancelled: 'bg-red-50 border-red-300 text-red-800 border-2',
  expired:
    'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-400 text-orange-900 border-2',
};

// Лейблы для карточек статистики
export const orderStatsLabels = {
  pending: 'Ожидание',
  scheduled: 'Предварительные',
  inProgress: 'Текущие',
  completed: 'Выполнены',
  cancelled: 'Отменены',
  expired: 'Просроченные',
};
