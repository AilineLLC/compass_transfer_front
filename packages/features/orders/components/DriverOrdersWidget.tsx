'use client';

import { useState } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AlertTriangle, Calendar, ChevronDown, ChevronUp, Clock, MapPin } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { DatePicker } from '@shared/ui/forms/date-picker';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import type { GetOrderDTO } from '@entities/orders/interface';
import { useDriverOrders, type PeriodType } from '../hooks/useDriverOrders';

interface DriverOrdersWidgetProps {
  driverId: string;
  currentOrderScheduledTime?: string | null;
  className?: string;
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  custom: 'Период',
};

// Конфликт если заказы пересекаются в пределах 60 минут
const CONFLICT_THRESHOLD_MINUTES = 60;

function isConflict(order: GetOrderDTO, currentScheduledTime: string): boolean {
  if (!order.scheduledTime) return false;
  const diff = Math.abs(
    differenceInMinutes(new Date(order.scheduledTime), new Date(currentScheduledTime)),
  );

  return diff < CONFLICT_THRESHOLD_MINUTES;
}

export function DriverOrdersWidget({
  driverId,
  currentOrderScheduledTime,
  className,
}: DriverOrdersWidgetProps) {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState(true);

  const { orders, isLoading, error } = useDriverOrders({
    driverId,
    period,
    customFrom: customFrom ?? null,
    customTo: customTo ?? null,
  });

  const conflictCount = currentOrderScheduledTime
    ? orders.filter(o => isConflict(o, currentOrderScheduledTime)).length
    : 0;

  return (
    <div className={className}>
      <div
        className='flex items-center justify-between cursor-pointer select-none py-1.5'
        onClick={() => setIsExpanded(v => !v)}
      >
        <div className='flex items-center gap-2'>
          <Calendar className='h-3.5 w-3.5 text-gray-500' />
          <span className='text-xs font-medium text-gray-700'>Расписание водителя</span>
          {conflictCount > 0 && (
            <Badge variant='destructive' className='text-xs px-1.5 py-0 h-4'>
              <AlertTriangle className='h-2.5 w-2.5 mr-0.5' />
              {conflictCount}
            </Badge>
          )}
          {orders.length > 0 && conflictCount === 0 && (
            <Badge variant='secondary' className='text-xs px-1.5 py-0 h-4'>
              {orders.length}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className='h-3.5 w-3.5 text-gray-400' />
        ) : (
          <ChevronDown className='h-3.5 w-3.5 text-gray-400' />
        )}
      </div>

      {isExpanded && (
        <div className='space-y-2 mt-1'>
          {/* Фильтр по периоду */}
          <div className='flex gap-1'>
            {(['day', 'week', 'month', 'custom'] as PeriodType[]).map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size='sm'
                onClick={e => {
                  e.stopPropagation();
                  setPeriod(p);
                }}
                className='flex-1 text-xs h-6 px-1 min-w-0'
              >
                {PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>

          {period === 'custom' && (
            <div className='flex gap-1.5'>
              <DatePicker
                value={customFrom}
                onChange={setCustomFrom}
                placeholder='С'
                className='h-7 text-xs flex-1'
                modal
              />
              <DatePicker
                value={customTo}
                onChange={setCustomTo}
                placeholder='По'
                className='h-7 text-xs flex-1'
                modal
              />
            </div>
          )}

          {/* Список заказов */}
          <div className='max-h-44 overflow-y-auto space-y-1 pr-0.5'>
            {isLoading ? (
              <div className='flex justify-center py-3'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500' />
              </div>
            ) : error ? (
              <p className='text-xs text-red-500 text-center py-2'>{error}</p>
            ) : orders.length === 0 ? (
              <p className='text-xs text-gray-400 text-center py-3'>Нет заказов за период</p>
            ) : (
              orders.map(order => {
                const conflict =
                  currentOrderScheduledTime ? isConflict(order, currentOrderScheduledTime) : false;

                return (
                  <div
                    key={order.id}
                    className={`p-2 rounded border text-xs ${
                      conflict ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className='flex items-center justify-between mb-0.5'>
                      <div className='flex items-center gap-1'>
                        {conflict && (
                          <AlertTriangle className='h-3 w-3 text-red-500 flex-shrink-0' />
                        )}
                        <Clock className='h-3 w-3 text-gray-400 flex-shrink-0' />
                        <span
                          className={`font-medium ${conflict ? 'text-red-700' : 'text-gray-700'}`}
                        >
                          {order.scheduledTime
                            ? format(new Date(order.scheduledTime), 'dd MMM, HH:mm', { locale: ru })
                            : '—'}
                        </span>
                      </div>
                      <span className='text-gray-400 font-mono text-[10px]'>
                        #{orderNumberToString(order.orderNumber)}
                      </span>
                    </div>
                    <div className='flex items-start gap-1'>
                      <MapPin className='h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0' />
                      <span className='text-gray-500 leading-tight line-clamp-1'>
                        {order.startLocation?.name || '—'} → {order.endLocation?.name || '—'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
