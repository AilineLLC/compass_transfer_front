import { DollarSign, Clock, Car, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';
import { Separator } from '@shared/ui/layout/separator';
import type { GetTariffDTOWithArchived } from '@entities/tariffs/interface';
import { ServiceClass, ServiceClassValues, CarType, CarTypeValues } from '@entities/tariffs/enums';
import { AuditEntityType } from '@entities/audit';
import { AuditSection } from '@features/audit';

interface TariffViewContentProps {
  tariff: GetTariffDTOWithArchived;
}



export function TariffViewContent({ tariff }: TariffViewContentProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className='space-y-6'>
      {/* Ценообразование */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Ценообразование
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Базовая цена */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Базовая цена</label>
              <p className='text-lg font-semibold text-gray-900 mt-1'>{formatPrice(tariff.basePrice)}</p>
              <p className='text-xs text-gray-500'>Стартовая стоимость поездки</p>
            </div>

            {/* Цена за минуту */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Цена за минуту</label>
              <p className='text-lg font-semibold text-gray-900 mt-1'>{formatPrice(tariff.minutePrice)}</p>
              <p className='text-xs text-gray-500'>Стоимость за каждую минуту поездки</p>
            </div>

            {/* Цена за километр */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Цена за километр</label>
              <p className='text-lg font-semibold text-gray-900 mt-1'>{formatPrice(tariff.perKmPrice)}</p>
              <p className='text-xs text-gray-500'>Стоимость за каждый километр</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Время ожидания */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Время ожидания
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className='text-sm font-medium text-gray-500'>Бесплатное время ожидания</label>
            <p className='text-lg font-semibold text-gray-900 mt-1'>
              {tariff.freeWaitingTimeMinutes} {tariff.freeWaitingTimeMinutes === 1 ? 'минута' : 'минут'}
            </p>
            <p className='text-xs text-gray-500'>
              Время, в течение которого водитель ожидает пассажира бесплатно
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Характеристики */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Car className='h-5 w-5' />
            Характеристики тарифа
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Класс обслуживания */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Класс обслуживания</label>
              <p className='text-base text-gray-900 mt-1'>
                {ServiceClassValues[tariff.serviceClass as ServiceClass] || tariff.serviceClass}
              </p>
            </div>

            {/* Тип автомобиля */}
            <div>
              <label className='text-sm font-medium text-gray-500'>Тип автомобиля</label>
              <p className='text-base text-gray-900 mt-1'>
                {CarTypeValues[tariff.carType as CarType] || tariff.carType}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Расчет стоимости */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Info className='h-5 w-5' />
            Как рассчитывается стоимость
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3 text-sm text-gray-600'>
            <div className='flex items-start gap-2'>
              <span className='font-medium text-gray-900'>1.</span>
              <span>Базовая цена: {formatPrice(tariff.basePrice)} (взимается в начале поездки)</span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='font-medium text-gray-900'>2.</span>
              <span>+ {formatPrice(tariff.perKmPrice)} за каждый километр</span>
            </div>
            <div className='flex items-start gap-2'>
              <span className='font-medium text-gray-900'>3.</span>
              <span>
                Бесплатное ожидание: {tariff.freeWaitingTimeMinutes} мин,
                затем дополнительная плата
              </span>
            </div>
                        <div className='flex items-start gap-2'>
              <span className='font-medium text-gray-900'>4.</span>
              <span>+ {formatPrice(tariff.minutePrice)} за каждую минуту ожидания</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuditSection entityType={AuditEntityType.Tariff} entityId={tariff.id} />
    </div>
  );
}
