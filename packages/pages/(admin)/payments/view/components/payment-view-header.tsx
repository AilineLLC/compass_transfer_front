import { DollarSign, CreditCard } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Card, CardContent } from '@shared/ui/layout';
import type { GetPaymentDTO } from '@shared/api/payments';
import { paymentTypeLabels, paymentGatewayLabels, paymentStatusLabels, paymentStatusColors, currencyLabels } from '@entities/payments';

interface PaymentViewHeaderProps {
  payment: GetPaymentDTO;
}

export function PaymentViewHeader({ payment }: PaymentViewHeaderProps) {
  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('ru-RU')} ${currencyLabels[payment.currency as keyof typeof currencyLabels]}`;
  };

  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-4'>
            {/* Иконка платежа */}
            <div className='flex-shrink-0'>
              <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center'>
                <DollarSign className='h-8 w-8 text-green-600' />
              </div>
            </div>

            {/* Основная информация */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Платеж #{payment.orderNumber || payment.id.slice(0, 8)}
                </h1>
                <Badge className={`${paymentStatusColors[payment.status]}`}>
                  {paymentStatusLabels[payment.status]}
                </Badge>
              </div>

              <div className='flex items-center gap-2 text-gray-600 mb-2'>
                <CreditCard className='h-4 w-4 flex-shrink-0' />
                <span className='text-sm font-semibold text-lg'>
                  {formatAmount(payment.amount, payment.currency)}
                </span>
              </div>

              <div className='flex items-center gap-4 text-sm text-gray-500'>
                <div className='flex items-center gap-1'>
                  <span className='font-medium'>Тип:</span>
                  <span>{paymentTypeLabels[payment.type]}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <span className='font-medium'>Шлюз:</span>
                  <span>{paymentGatewayLabels[payment.gateway]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ID платежа */}
          <div className='flex flex-col gap-2'>
            <div className='text-xs text-gray-500 text-right'>ID платежа</div>
            <div className='font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded'>
              {payment.id}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
