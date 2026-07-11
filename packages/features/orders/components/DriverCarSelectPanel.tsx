'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Car } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { carsApi } from '@shared/api/cars';
import type { GetCarDTO } from '@entities/cars/interface';
import { ServiceClassValues } from '@entities/tariffs/enums/ServiceClass.enum';
import type { ServiceClass } from '@entities/tariffs/enums/ServiceClass.enum';

interface DriverCarSelectPanelProps {
  driverId: string;
  driverName: string;
  requiredServiceClass?: string | null;
  onSelect: (car: GetCarDTO) => void;
  onBack: () => void;
}

export function DriverCarSelectPanel({
  driverId,
  driverName,
  requiredServiceClass,
  onSelect,
  onBack,
}: DriverCarSelectPanelProps) {
  const [cars, setCars] = useState<GetCarDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await carsApi.getCars({ Driver: driverId });
        setCars(result.data ?? []);
      } catch {
        setError('Не удалось загрузить машины водителя');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [driverId]);

  return (
    <div>
      <div className='mb-3 flex items-center gap-2'>
        <button
          onClick={onBack}
          className='rounded-full p-1 transition-colors hover:bg-gray-100'
          title='Назад к списку водителей'
        >
          <ArrowLeft className='h-4 w-4 text-gray-600' />
        </button>
        <span className='truncate text-sm font-medium text-gray-700'>
          Машины водителя: {driverName}
        </span>
      </div>

      {isLoading ? (
        <div className='py-4 text-center text-sm text-gray-500'>Загрузка...</div>
      ) : error ? (
        <div className='py-4 text-center text-sm text-red-500'>{error}</div>
      ) : cars.length === 0 ? (
        <div className='py-4 text-center'>
          <Car className='mx-auto mb-1 h-6 w-6 text-gray-300' />
          <p className='text-sm text-gray-500'>У водителя нет привязанных машин</p>
        </div>
      ) : (
        <div className='max-h-60 space-y-1.5 overflow-y-auto'>
          {cars.map(car => {
            const classLabel =
              ServiceClassValues[car.serviceClass as unknown as ServiceClass] || car.serviceClass;
            const isIncompatible =
              !!requiredServiceClass && car.serviceClass !== requiredServiceClass;

            return (
              <button
                key={car.id}
                disabled={isIncompatible}
                onClick={() => onSelect(car)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  isIncompatible
                    ? 'cursor-not-allowed border-red-200 bg-red-50 opacity-60'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <p className='font-medium text-gray-900'>
                  {car.make} {car.model} · {car.year}
                </p>
                <div className='mt-1 flex flex-wrap gap-1'>
                  <Badge variant='outline' className='font-mono text-xs'>
                    {car.licensePlate}
                  </Badge>
                  <Badge
                    variant='outline'
                    className={`text-xs ${isIncompatible ? 'border-red-300 text-red-600' : ''}`}
                  >
                    {classLabel}
                  </Badge>
                </div>
                {isIncompatible && (
                  <p className='mt-1 text-xs text-red-500'>
                    Класс не совпадает с классом заказа
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
