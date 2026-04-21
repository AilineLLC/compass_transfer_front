'use client';

import { ArrowLeft, Edit, Trash2, DollarSign, BellRing } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { notificationsApi } from '@shared/api/notifications';
import { useUserRole } from '@shared/contexts/user-role-context';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { OrderStatus } from '@entities/orders/enums';
import type { GetOrderDTO } from '@entities/orders/interface';
import { NotificationType } from '@entities/notifications';
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
  const [isNotifying, setIsNotifying] = useState(false);
  const { userRole } = useUserRole();

  // Партнеры не могут редактировать и удалять заказы
  const canEditOrders = userRole !== Role.Partner;
  const canDeleteOrders = userRole !== Role.Partner;

  const assignedDriverId = order.rides?.[0]?.driverId;
  const canNotifyDriver =
    assignedDriverId &&
    (order.status === OrderStatus.Pending || order.status === OrderStatus.Scheduled);

  const handleNotifyDriver = async () => {
    if (!assignedDriverId) return;
    setIsNotifying(true);
    try {
      await notificationsApi.broadcastToUser(assignedDriverId, {
        type: NotificationType.RideRequest,
        title: 'Повторный запрос на поездку',
        content: `Заказ #${order.orderNumber} ожидает подтверждения`,
        data: { orderId: order.id, orderType: order.type },
      });
      toast.success('Уведомление отправлено водителю');
    } catch {
      toast.error('Не удалось отправить уведомление водителю');
    } finally {
      setIsNotifying(false);
    }
  };

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

        {canNotifyDriver && (
          <Button
            onClick={handleNotifyDriver}
            variant='outline'
            className='w-full justify-start'
            disabled={isNotifying}
          >
            <BellRing className='h-4 w-4 mr-2' />
            {isNotifying ? 'Отправка...' : 'Уведомить водителя повторно'}
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
