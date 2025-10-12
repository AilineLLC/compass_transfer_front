'use client';

import { useRouter } from 'next/navigation';
import { OrderType } from '@entities/orders/enums/OrderType.enum';
import { useScheduledOrderById } from '@entities/orders/hooks';
import { getOrderEditRoute } from '@entities/orders/utils/order-routes';
import { ScheduledOrderViewActions } from './components/scheduled-order-view-actions';
import { ScheduledOrderViewContent } from './components/scheduled-order-view-content';
import { ScheduledOrderViewError } from './components/scheduled-order-view-error';
import { ScheduledOrderViewHeader } from './components/scheduled-order-view-header';
import { ScheduledOrderViewLoading } from './components/scheduled-order-view-loading';

interface ScheduledOrderViewPageProps {
  orderId: string;
}

export function ScheduledOrderViewPage({ orderId }: ScheduledOrderViewPageProps) {
  const router = useRouter();

  const {
    order,
    isLoading,
    error
  } = useScheduledOrderById(orderId);

  const handleBack = () => {
    router.push('/orders');
  };

  const handleEdit = () => {
    if (order) {
      router.push(getOrderEditRoute(order.id, OrderType.Scheduled));
    }
  };

  if (isLoading) {
    return <ScheduledOrderViewLoading />;
  }

  if (error || !order) {
    return (
      <ScheduledOrderViewError
        error={typeof error === 'string' ? error : 'Заказ с указанным ID не существует или был удален'}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className='pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white flex flex-col gap-6 p-6 overflow-y-auto'>
      {/* Заголовок */}
      <ScheduledOrderViewHeader order={order} />

      {/* Двухколоночный layout */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Левая колонка - основная информация (3/4 ширины) */}
        <div className='lg:col-span-3'>
          <ScheduledOrderViewContent order={order} />
        </div>

        {/* Правая колонка - кнопки действий (1/4 ширины) */}
        <div className='lg:col-span-1'>
          <ScheduledOrderViewActions
            order={order}
            onEdit={handleEdit}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
}
