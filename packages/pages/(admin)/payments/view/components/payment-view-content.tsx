import { DollarSign, CreditCard, Info, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import type { GetPaymentDTO } from '@shared/api/payments';
import { paymentTypeLabels, paymentGatewayLabels, currencyLabels } from '@entities/payments';

interface PaymentViewContentProps {
  payment: GetPaymentDTO;
}

export function PaymentViewContent({ payment }: PaymentViewContentProps) {
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString('ru-RU')} ${currencyLabels[payment.currency]}`;
  };

  return (
    <div className='space-y-6'>
      {/* Информация о платеже */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Информация о платеже
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Сумма */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Сумма платежа</label>
              <p className='text-2xl font-bold text-gray-900 mt-1'>{formatAmount(payment.amount)}</p>
              <p className='text-xs text-gray-500'>Общая сумма транзакции</p>
            </div>

            {/* Валюта */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Валюта</label>
              <p className='text-lg font-semibold text-gray-900 mt-1'>{currencyLabels[payment.currency]}</p>
              <p className='text-xs text-gray-500'>Валюта платежа</p>
            </div>

            {/* Тип платежа */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Тип платежа</label>
              <p className='text-base text-gray-900 mt-1'>{paymentTypeLabels[payment.type]}</p>
            </div>

            {/* Платежный шлюз */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Платежный шлюз</label>
              <p className='text-base text-gray-900 mt-1'>{paymentGatewayLabels[payment.gateway]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Связанные данные */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <LinkIcon className='h-5 w-5' />
            Связанные данные
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* ID Заказа */}
          <div>
            <label className='text-sm font-medium text-gray-500'>ID Заказа</label>
            <p className='font-mono text-sm text-gray-900 mt-1 bg-gray-50 px-3 py-2 rounded break-all'>
              {payment.orderId}
            </p>
            <p className='text-xs text-gray-500 mt-1'>Идентификатор связанного заказа</p>
          </div>

          {/* ID Пользователя */}
          <div>
            <label className='text-sm font-medium text-gray-500'>ID Пользователя</label>
            <p className='font-mono text-sm text-gray-900 mt-1 bg-gray-50 px-3 py-2 rounded break-all'>
              {payment.userId}
            </p>
            <p className='text-xs text-gray-500 mt-1'>Идентификатор пользователя, совершившего платеж</p>
          </div>
        </CardContent>
      </Card>

      {/* Метаданные */}
      {payment.metadata && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Info className='h-5 w-5' />
              Дополнительная информация
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className='text-sm font-medium text-gray-500'>Метаданные</label>
              <pre className='font-mono text-xs bg-gray-50 p-4 rounded mt-2 overflow-x-auto text-gray-900 border border-gray-200'>
                {payment.metadata}
              </pre>
              <p className='text-xs text-gray-500 mt-2'>
                Дополнительные данные о платеже от платежного шлюза
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Информация о процессе */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Процесс обработки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3 text-sm text-gray-600'>
            <div className='flex items-start gap-2'>
              <span className='font-medium text-gray-900'>1.</span>
              <span>Платеж инициирован через {paymentGatewayLabels[payment.gateway]}</span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='font-medium text-gray-900'>2.</span>
              <span>Тип транзакции: {paymentTypeLabels[payment.type]}</span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='font-medium text-gray-900'>3.</span>
              <span>Сумма: {formatAmount(payment.amount)}</span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='font-medium text-gray-900'>4.</span>
              <span>Референс транзакции: {payment.reference}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
