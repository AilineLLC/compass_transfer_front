import { apiGet } from './client';

// Типы платежей
export enum PaymentType {
  Payment = 'Payment',
  Refund = 'Refund',
  Withdrawal = 'Withdrawal',
  Deposit = 'Deposit',
  Transfer = 'Transfer',
  Fee = 'Fee',
  Adjustment = 'Adjustment',
  Bonus = 'Bonus',
  Fine = 'Fine',
}

// Платежные шлюзы
export enum PaymentGateway {
  OptimaQR = 'OptimaQR',
  Cash = 'Cash',
  Card = 'Card',
}

// Статусы платежей
export enum PaymentStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  Reversed = 'Reversed',
}

// Валюты
export enum Currency {
  USD = 'USD',
  KGS = 'KGS',
  EUR = 'EUR',
  RUB = 'RUB',
  KZT = 'KZT',
}

// Интерфейс платежа
export interface GetPaymentDTO {
  id: string;
  type: PaymentType;
  gateway: PaymentGateway;
  status: PaymentStatus;
  orderId: string;
  userId: string;
  amount: number;
  currency: Currency;
  reference: string;
  metadata?: string;
}

// Фильтры для платежей
export interface PaymentFilters {
  first?: boolean;
  before?: string;
  after?: string;
  size?: number;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
  
  // Фильтры
  'Type.In'?: PaymentType[];
  'Gateway.In'?: PaymentGateway[];
  'Status.In'?: PaymentStatus[];
  'Currency.In'?: Currency[];
  'HasOrder'?: boolean;
  'OrderId.Equals'?: string;
  'UserId.Equals'?: string;
}

// Ответ API для платежей
export interface PaymentApiResponse {
  data: GetPaymentDTO[];
  totalCount: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// API методы для платежей
export const paymentsApi = {
  // Получение списка платежей
  getPayments: async (filters: PaymentFilters = {}): Promise<PaymentApiResponse> => {
    const result = await apiGet<PaymentApiResponse>('/Payment', { params: filters });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение платежа по ID
  getPaymentById: async (paymentId: string): Promise<GetPaymentDTO> => {
    const result = await apiGet<GetPaymentDTO>(`/Payment/${paymentId}`);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение моих платежей
  getMyPayments: async (filters: PaymentFilters = {}): Promise<PaymentApiResponse> => {
    const result = await apiGet<PaymentApiResponse>('/Payment/my', { params: filters });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },

  // Получение платежей по OrderId
  getPaymentsByOrderId: async (orderId: string): Promise<PaymentApiResponse> => {
    const result = await apiGet<PaymentApiResponse>('/Payment', { 
      params: { 'OrderId.Equals': orderId } 
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data!;
  },
};
