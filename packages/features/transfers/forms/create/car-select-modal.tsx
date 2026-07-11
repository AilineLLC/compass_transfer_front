'use client';

import { Search, Car, X, Users } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui/layout/dialog';
import type { GetCarDTO } from '@entities/cars/interface';
import { carsApi } from '@shared/api/cars';

interface CarSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (car: GetCarDTO) => void;
  selectedCarId?: string | null;
  driverId?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  Available: 'Доступен',
  Busy: 'Занят',
  Maintenance: 'Обслуживание',
  Inactive: 'Неактивен',
};

export function CarSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedCarId,
  driverId,
}: CarSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cars, setCars] = useState<GetCarDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCars = useCallback(async (query?: string) => {
    if (!driverId) {
      setCars([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await carsApi.getCars({
        Driver: driverId,
        first: true,
        size: 100,
        ...(query ? { licensePlate: query, licensePlateOp: 'Contains' as const } : {}),
      });
      setCars(response.data);
    } catch {
      setCars([]);
    } finally {
      setIsLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (isOpen) loadCars();
  }, [isOpen, loadCars]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }
    const timer = setTimeout(() => {
      loadCars(searchQuery.trim() || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, loadCars]);

  const handleSelect = (car: GetCarDTO) => {
    onSelect(car);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[600px] h-[80vh] flex flex-col z-[1000]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-lg'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
              <Car className='h-4 w-4 text-primary' />
            </div>
            Выберите автомобиль
          </DialogTitle>
        </DialogHeader>

        <div className='relative my-2'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Поиск по гос. номеру, марке или модели...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-10 h-10'
            autoFocus
          />
        </div>

        <div className='flex-1 overflow-y-auto space-y-2 pr-1'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-12 gap-3'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
              <p className='text-sm text-muted-foreground'>Загрузка автомобилей...</p>
            </div>
          ) : cars.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-muted-foreground gap-2'>
              <Car className='h-12 w-12 opacity-20' />
              <p className='font-medium'>
                {!driverId ? 'Сначала выберите водителя' : 'У водителя нет привязанных автомобилей'}
              </p>
              {!driverId && (
                <p className='text-sm'>Автомобили загружаются только после выбора водителя</p>
              )}
            </div>
          ) : (
            cars.map(car => {
              const isSelected = car.id === selectedCarId;
              const isAvailable = car.status === 'Available';
              return (
                <div
                  key={car.id}
                  className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-sm'
                  }`}
                  onClick={() => handleSelect(car)}
                >
                  <div className='flex items-center gap-4'>
                    {/* Иконка авто */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Car className='h-5 w-5' />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <p className='font-semibold text-sm'>
                          {car.make} {car.model}
                          <span className='font-normal text-muted-foreground ml-1'>({car.year})</span>
                        </p>
                        <Badge
                          variant={isAvailable ? 'default' : 'secondary'}
                          className='text-xs px-1.5 py-0'
                        >
                          {STATUS_LABELS[car.status] ?? car.status}
                        </Badge>
                      </div>

                      <div className='flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1'>
                        <span className='text-xs font-mono text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded'>
                          {car.licensePlate}
                        </span>
                        <span className='flex items-center gap-1 text-xs text-muted-foreground ml-2'>
                          <Users className='h-3 w-3' />
                          {car.passengerCapacity} мест
                        </span>
                        <span className='text-xs text-muted-foreground ml-2'>
                          {car.type} · {car.serviceClass}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className='shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                        <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className='flex items-center justify-between pt-3 border-t'>
          <p className='text-xs text-muted-foreground'>
            {cars.length > 0 && `${cars.length} автомобилей`}
          </p>
          <Button variant='outline' size='sm' onClick={onClose}>
            <X className='mr-2 h-3.5 w-3.5' />
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
