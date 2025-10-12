'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { paymentsApi, type GetPaymentDTO } from '@shared/api/payments';
import { paymentTypeLabels, paymentGatewayLabels, paymentStatusLabels, paymentStatusColors, currencyLabels } from '@entities/payments';

interface OrderPaymentsSectionProps {
  orderId: string;
}

export function OrderPaymentsSection({ orderId }: OrderPaymentsSectionProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<GetPaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await paymentsApi.getPaymentsByOrderId(orderId);

        setPayments(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки платежей');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchPayments();
    }
  }, [orderId]);

  const handleViewPayment = (paymentId: string) => {
    router.push(`/payments/${paymentId}`);
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('ru-RU')} ${currencyLabels[currency as keyof typeof currencyLabels]}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Платежи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Платежи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-red-600'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Платежи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>Нет платежей для этого заказа</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <DollarSign className='h-5 w-5' />
          Платежи ({payments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {payments.map((payment) => (
            <div
              key={payment.id}
              className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'
            >
              <div className='flex-1 space-y-2'>
                <div className='flex items-center gap-3'>
                  <Badge className={`${paymentStatusColors[payment.status]}`}>
                    {paymentStatusLabels[payment.status]}
                  </Badge>
                  <span className='text-sm text-muted-foreground'>
                    {paymentTypeLabels[payment.type]}
                  </span>
                  <span className='text-sm text-muted-foreground'>•</span>
                  <span className='text-sm text-muted-foreground'>
                    {paymentGatewayLabels[payment.gateway]}
                  </span>
                </div>

                <div className='flex items-center gap-4'>
                  <div>
                    <p className='text-xs text-muted-foreground'>Сумма</p>
                    <p className='text-lg font-semibold'>
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Референс</p>
                    <p className='text-sm font-mono'>{payment.reference}</p>
                  </div>
                </div>
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() => handleViewPayment(payment.id)}
                className='gap-2'
              >
                <Eye className='h-4 w-4' />
                Подробнее
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
