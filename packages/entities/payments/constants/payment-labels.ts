import { PaymentType, PaymentGateway, PaymentStatus, Currency } from '@shared/api/payments';

// Русские названия для типов платежей
export const paymentTypeLabels: Record<PaymentType, string> = {
  [PaymentType.Payment]: 'Оплата',
  [PaymentType.Refund]: 'Возврат',
  [PaymentType.Withdrawal]: 'Вывод средств',
  [PaymentType.Deposit]: 'Пополнение',
  [PaymentType.Transfer]: 'Перевод',
  [PaymentType.Fee]: 'Комиссия',
  [PaymentType.Adjustment]: 'Корректировка',
  [PaymentType.Bonus]: 'Бонус',
  [PaymentType.Fine]: 'Штраф',
};

// Русские названия для платежных шлюзов
export const paymentGatewayLabels: Record<PaymentGateway, string> = {
  [PaymentGateway.OptimaQR]: 'OptimaQR',
  [PaymentGateway.Cash]: 'Наличные',
  [PaymentGateway.Card]: 'Карта',
};

// Русские названия для статусов платежей
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'Ожидание',
  [PaymentStatus.Completed]: 'Завершен',
  [PaymentStatus.Failed]: 'Ошибка',
  [PaymentStatus.Cancelled]: 'Отменен',
  [PaymentStatus.Reversed]: 'Отменен (возврат)',
};

// Цвета для статусов платежей (Tailwind CSS классы)
export const paymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.Completed]: 'bg-green-100 text-green-800',
  [PaymentStatus.Failed]: 'bg-red-100 text-red-800',
  [PaymentStatus.Cancelled]: 'bg-gray-100 text-gray-800',
  [PaymentStatus.Reversed]: 'bg-purple-100 text-purple-800',
};

// Русские названия для валют
export const currencyLabels: Record<Currency, string> = {
  [Currency.USD]: 'USD',
  [Currency.KGS]: 'сом',
  [Currency.EUR]: 'EUR',
  [Currency.RUB]: 'руб',
  [Currency.KZT]: 'тенге',
};
