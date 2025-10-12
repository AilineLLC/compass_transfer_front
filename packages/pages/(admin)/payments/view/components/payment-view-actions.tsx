'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import type { GetPaymentDTO } from '@shared/api/payments';

interface PaymentViewActionsProps {
  payment: GetPaymentDTO;
  onBack: () => void;
}

export function PaymentViewActions({ payment, onBack }: PaymentViewActionsProps) {
  const router = useRouter();

  const handleViewOrder = () => {
    // Переход к заказу (нужно будет определить тип заказа)
    router.push(`/orders/instant/${payment.orderId}`);
  };

  const handleViewUser = () => {
    router.push(`/users/${payment.userId}`);
  };

  return (
    <div className='sticky top-4 flex flex-col gap-4'>
      {/* Основные действия */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Действия</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Кнопка "Назад" */}
          <Button
            variant='outline'
            onClick={onBack}
            className='w-full justify-start'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Назад к списку
          </Button>

          {/* Кнопка "Просмотр заказа" */}
          <Button
            variant='default'
            onClick={handleViewOrder}
            className='w-full justify-start'
          >
            <ExternalLink className='mr-2 h-4 w-4' />
            Просмотр заказа
          </Button>

          {/* Кнопка "Просмотр пользователя" */}
          <Button
            variant='outline'
            onClick={handleViewUser}
            className='w-full justify-start'
          >
            <ExternalLink className='mr-2 h-4 w-4' />
            Просмотр пользователя
          </Button>
        </CardContent>
      </Card>

      {/* Информация о референсе */}
      {payment.reference && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Референс</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='font-mono text-xs text-gray-600 break-all'>
              {payment.reference}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
