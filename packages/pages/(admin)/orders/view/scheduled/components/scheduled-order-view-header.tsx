import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Skeleton } from '@shared/ui/data-display/skeleton';
import { Card, CardContent } from '@shared/ui/layout';
import { orderStatusLabels, orderSubStatusLabels, orderStatusColors } from '@entities/orders';
import type { GetOrderDTO } from '@entities/orders/interface';
import { useLocation } from '@features/locations/hooks/useLocation';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';

interface ScheduledOrderViewHeaderProps {
  order: GetOrderDTO;
}

export function ScheduledOrderViewHeader({ order }: ScheduledOrderViewHeaderProps) {
  // Запросы для получения локаций
  const { location: startLocation, isLoading: startLocationLoading } = useLocation(order.startLocationId || '');
  const { location: endLocation, isLoading: endLocationLoading } = useLocation(order.endLocationId || '');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    // Если заказ отменен системой - показываем расчетную цену
    if (order.subStatus === 'CancelledBySystem') {
      if (order.initialPrice && order.initialPrice > 0) {
        return new Intl.NumberFormat('ru-RU').format(order.initialPrice) + ' сом';
      }

      return 'Не применимо';
    }

    // Если заказ отменен или истек
    if (order.status === 'Cancelled' || order.status === 'Expired') {
      return 'Отменен';
    }

    // Если заказ завершен, но цены нет - это ошибка
    if (order.status === 'Completed' && (!price || price === 0)) {
      return 'Ошибка расчета';
    }

    // Если заказ в процессе или запланирован
    if (!price || price === 0) return 'В процессе';
    
    return new Intl.NumberFormat('ru-RU').format(price) + ' сом';
  };

  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-4'>
            {/* Иконка заказа */}
            <div className='flex-shrink-0'>
              <div className='w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center'>
                <Calendar className='h-8 w-8 text-purple-600' />
              </div>
            </div>

            {/* Основная информация */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='text-2xl font-bold text-gray-900 truncate'>
                  Запланированный заказ #{orderNumberToString(order.orderNumber)}
                </h1>
                <Badge 
                  className={`${orderStatusColors[order.status]} text-white`}
                >
                  {orderStatusLabels[order.status] || order.status}
                </Badge>
                {order.subStatus && (
                  <Badge variant="outline">
                    {orderSubStatusLabels[order.subStatus] || order.subStatus}
                  </Badge>
                )}
              </div>

              <div className='flex items-center gap-2 text-gray-600 mb-2'>
                <Calendar className='h-4 w-4 flex-shrink-0' />
                <span className='text-sm'>
                  {order.scheduledTime 
                    ? `Запланирован на: ${formatDate(order.scheduledTime)}`
                    : `Создан: ${formatDate(order.createdAt)}`
                  }
                </span>
              </div>

              <div className='flex items-center gap-4 text-sm text-gray-500'>
                <div className='flex items-center gap-1'>
                  <MapPin className='h-4 w-4 flex-shrink-0' />
                  <span className='font-medium'>Маршрут:</span>
                  <span className='truncate'>
                    {startLocationLoading ? (
                      <Skeleton className='h-4 w-20 inline-block' />
                    ) : (
                      startLocation?.name || 'Не указано'
                    )} → {endLocationLoading ? (
                      <Skeleton className='h-4 w-20 inline-block' />
                    ) : (
                      endLocation?.name || 'Не указано'
                    )}
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <DollarSign className='h-4 w-4 flex-shrink-0' />
                  <span className='font-medium'>Стоимость:</span>
                  <span className={`font-semibold ${
                    order.status === 'Expired' || order.subStatus === 'CancelledBySystem'
                      ? 'text-gray-500'
                      : !order.finalPrice || order.finalPrice === 0
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}>
                    {formatPrice(order.finalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
