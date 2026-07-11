'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { carsApi } from '@shared/api/cars';
import { Button } from '@shared/ui/forms/button';
import { DeleteConfirmationModal } from '@shared/ui/modals/delete-confirmation-modal';
import type { GetDriverDTO } from '@entities/users/interface';
import { getCarFeatureLabel } from '@entities/cars/lib/car-helpers';

interface DriverCarsInfoProps {
  driver: GetDriverDTO;
  onCarRemoved?: () => void;
}

export function DriverCarsInfo({ driver, onCarRemoved }: DriverCarsInfoProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const activeCar = !isRemoved ? driver.activeCar : null;

  const handleRemoveConfirm = async () => {
    if (!activeCar?.id) return;

    try {
      setIsRemoving(true);
      await carsApi.removeDriver(activeCar.id, driver.id);
      setIsRemoved(true);
      setIsDeleteModalOpen(false);
      toast.success('Автомобиль успешно откреплён от водителя');
      onCarRemoved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при откреплении автомобиля');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Назначенные автомобили</h3>
      <div className='space-y-3'>
        {activeCar ? (
          <div className='p-4 rounded-lg border bg-orange-50 border-orange-200'>
            <div className='flex items-start justify-between'>
              <div>
                <h4 className='font-medium'>{activeCar.make} {activeCar.model}</h4>
                <p className='text-sm text-muted-foreground'>
                  Гос. номер: {activeCar.licensePlate}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Год: {activeCar.year} | Цвет: {activeCar.color}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Тип: {activeCar.type} | Класс: {activeCar.serviceClass}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Вместимость: {activeCar.passengerCapacity} чел. | Статус: {activeCar.status}
                </p>
                {activeCar.features && activeCar.features.length > 0 && (
                  <p className='text-sm text-muted-foreground'>
                    Опции: {activeCar.features.map(f => getCarFeatureLabel(f)).join(', ')}
                  </p>
                )}
                {activeCar.drivers && activeCar.drivers.length > 0 && (
                  <p className='text-xs text-muted-foreground mt-1'>
                    Назначен:{' '}
                    {new Date(
                      activeCar.drivers.find(d => d.driverId === driver.id)?.assignedAt || ''
                    ).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
              <div className='flex flex-col items-end gap-2'>
                <span className='text-sm text-green-600 font-medium'>Активен</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={isRemoving}
                  className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className='p-4 rounded-lg border bg-gray-50 border-gray-200'>
            <div className='text-center text-muted-foreground'>
              <p>Автомобиль не назначен</p>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleRemoveConfirm}
        title='Открепить автомобиль'
        description={
          activeCar
            ? `Вы уверены, что хотите открепить автомобиль "${activeCar.make} ${activeCar.model} (${activeCar.licensePlate})" от водителя? Это действие нельзя отменить.`
            : 'Вы уверены, что хотите открепить автомобиль от водителя?'
        }
      />
    </div>
  );
}
