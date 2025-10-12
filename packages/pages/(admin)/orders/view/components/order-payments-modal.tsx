'use client';

import { DollarSign, Eye, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { paymentsApi, type GetPaymentDTO } from '@shared/api/payments';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/modals/dialog';
import { paymentTypeLabels, paymentGatewayLabels, paymentStatusLabels, paymentStatusColors, currencyLabels } from '@entities/payments';

interface OrderPaymentsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderPaymentsModal({ orderId, isOpen, onClose }: OrderPaymentsModalProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<GetPaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!isOpen || !orderId) return;

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

    fetchPayments();
  }, [orderId, isOpen]);

  const handleViewPayment = (paymentId: string) => {
    router.push(`/payments/${paymentId}`);
    onClose();
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString('ru-RU')} ${currencyLabels[currency as keyof typeof currencyLabels]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Платежи по заказу
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {loading && (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          )}

          {error && (
            <div className='text-center py-8'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          {!loading && !error && payments.length === 0 && (
            <div className='text-center py-8'>
              <DollarSign className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-sm text-muted-foreground'>Нет платежей для этого заказа</p>
            </div>
          )}

          {!loading && !error && payments.length > 0 && (
            <div className='space-y-3'>
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'
                >
                  <div className='flex-1 space-y-2'>
                    <div className='flex items-center gap-3 flex-wrap'>
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

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <p className='text-xs text-muted-foreground'>Сумма</p>
                        <p className='text-lg font-semibold'>
                          {formatAmount(payment.amount, payment.currency)}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-muted-foreground'>Референс</p>
                        <p className='text-sm font-mono truncate'>{payment.reference}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleViewPayment(payment.id)}
                    className='gap-2 ml-4'
                  >
                    <Eye className='h-4 w-4' />
                    Подробнее
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
