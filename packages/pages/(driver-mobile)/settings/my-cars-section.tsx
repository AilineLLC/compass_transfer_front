'use client';

import { useState, useEffect, useCallback } from 'react';
import { Car, CheckCircle2, Loader2 } from 'lucide-react';
import { carsApi } from '@shared/api/cars';
import { driverProfileApi } from '@shared/api/driver-profile';
import type { GetCarDTO } from '@entities/cars/interface';

const carColorLabels: Record<string, string> = {
  White: 'Белый',
  Black: 'Черный',
  Silver: 'Серебристый',
  Gray: 'Серый',
  Red: 'Красный',
  Blue: 'Синий',
  Green: 'Зеленый',
  Yellow: 'Желтый',
  Orange: 'Оранжевый',
  Brown: 'Коричневый',
  Purple: 'Фиолетовый',
  Pink: 'Розовый',
  Gold: 'Золотой',
  Beige: 'Бежевый',
  Maroon: 'Бордовый',
};

export function MyCarsSection() {
  const [cars, setCars] = useState<GetCarDTO[]>([]);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [carsResult, profile] = await Promise.all([
        carsApi.getMyCars({ Size: 50 }),
        driverProfileApi.getUserSelf(),
      ]);
      setCars(carsResult.data);
      setActiveCarId(profile.activeCarId ?? null);
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = async (car: GetCarDTO) => {
    if (activatingId || car.id === activeCarId) return;
    try {
      setActivatingId(car.id);
      await carsApi.setActiveCar(car.id);
      setActiveCarId(car.id);
    } catch {
      // silent
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className='bg-white rounded-2xl shadow-sm'>
      <div className='p-4 border-b border-gray-100'>
        <h2 className='text-lg font-semibold text-gray-900'>Мои автомобили</h2>
      </div>

      <div className='p-4'>
        {loading ? (
          <div className='flex items-center justify-center py-6 text-gray-400'>
            <Loader2 className='w-5 h-5 animate-spin mr-2' />
            <span className='text-sm'>Загрузка...</span>
          </div>
        ) : cars.length === 0 ? (
          <div className='flex flex-col items-center py-6 text-gray-400'>
            <Car className='w-8 h-8 mb-2' />
            <span className='text-sm'>Нет привязанных автомобилей</span>
          </div>
        ) : (
          <div className='space-y-3'>
            {cars.map((car) => {
              const isActive = car.id === activeCarId;
              const isActivating = activatingId === car.id;

              return (
                <div
                  key={car.id}
                  onClick={() => handleSelect(car)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isActive
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-100 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <Car className={`w-5 h-5 shrink-0 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
                    <div className='min-w-0'>
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-green-800' : 'text-gray-900'}`}>
                        {car.make} {car.model} ({car.year})
                      </p>
                      <p className='text-xs text-gray-500 truncate'>
                        {car.licensePlate} · {carColorLabels[car.color] ?? car.color}
                      </p>
                    </div>
                  </div>

                  <div className='ml-3 shrink-0'>
                    {isActive ? (
                      <CheckCircle2 className='w-5 h-5 text-green-600' />
                    ) : isActivating ? (
                      <Loader2 className='w-5 h-5 text-gray-400 animate-spin' />
                    ) : (
                      <span className='text-xs text-blue-600 font-medium'>Выбрать</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
