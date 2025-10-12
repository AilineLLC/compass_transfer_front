'use client';

import { ArrowLeft, Edit, Trash2, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useUserRole } from '@shared/contexts/user-role-context';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import type { GetOrderDTO } from '@entities/orders/interface';
import { Role } from '@entities/users/enums';
import { OrderPaymentsModal } from '../../components/order-payments-modal';

interface InstantOrderViewActionsProps {
  order: GetOrderDTO;
  onEdit: () => void;
  onDelete?: () => void;
  onBack: () => void;
}

export function InstantOrderViewActions({
  order,
  onEdit,
  onDelete,
  onBack
}: InstantOrderViewActionsProps) {
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const { userRole } = useUserRole();

  // Партнеры не могут редактировать и удалять заказы
  const canEditOrders = userRole !== Role.Partner;
  const canDeleteOrders = userRole !== Role.Partner;

  return (
    <div className='sticky top-4'>
      <Card>
        <CardHeader>
          <CardTitle>Действия</CardTitle>
        </CardHeader>
      <CardContent className='space-y-3'>
        <Button
          onClick={onBack}
          variant='outline'
          className='w-full justify-start'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Назад к списку
        </Button>

        {canEditOrders && (
          <Button
            onClick={onEdit}
            variant='default'
            className='w-full justify-start'
          >
            <Edit className='h-4 w-4 mr-2' />
            Редактировать
          </Button>
        )}

        {onDelete && canDeleteOrders && (
          <Button
            onClick={onDelete}
            variant='destructive'
            className='w-full justify-start'
          >
            <Trash2 className='h-4 w-4 mr-2' />
            Удалить
          </Button>
        )}

        {/* Кнопка просмотра платежей */}
        <Button
          onClick={() => setIsPaymentsModalOpen(true)}
          variant='outline'
          className='w-full justify-start'
        >
          <DollarSign className='h-4 w-4 mr-2' />
          Платежи
        </Button>
      </CardContent>
      </Card>

      {/* Модальное окно платежей */}
      <OrderPaymentsModal
        orderId={order.id}
        isOpen={isPaymentsModalOpen}
        onClose={() => setIsPaymentsModalOpen(false)}
      />
    </div>
  );
}
