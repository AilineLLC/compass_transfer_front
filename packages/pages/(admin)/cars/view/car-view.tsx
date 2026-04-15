'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { carsApi } from '@shared/api/cars';
import { filesApi } from '@shared/api/files';
import type { GetCarDTO } from '@entities/cars/interface';
import { CarFeature } from '@entities/cars/enums';
import type { CarImageItem } from '@entities/cars';
import { CarViewHeader } from './components/car-view-header';
import { CarViewActions } from './components/car-view-actions';
import { CarViewContent } from './components/car-view-content';
import { CarViewLoading } from './components/car-view-loading';
import { CarViewError } from './components/car-view-error';
import { AddDriverModal } from './components/add-driver-modal';
import { ManageFeaturesModal } from './components/manage-features-modal';

interface CarViewProps {
  carId: string;
}

export function CarView({ carId }: CarViewProps) {
  const router = useRouter();
  const [car, setCar] = useState<GetCarDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [isManageFeaturesModalOpen, setIsManageFeaturesModalOpen] = useState(false);

  // Загрузка данных автомобиля
  useEffect(() => {
    const loadCar = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const carData = await carsApi.getCarById(carId);
        setCar(carData);
      } catch (err) {
        console.error('Ошибка загрузки автомобиля:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки автомобиля');
      } finally {
        setLoading(false);
      }
    };

    if (carId) {
      loadCar();
    }
  }, [carId]);

  // Обработчик возврата к списку
  const handleBackToList = () => {
    router.push('/cars');
  };

  // Обработчик редактирования
  const handleEdit = () => {
    router.push(`/cars/edit/${carId}`);
  };

  // Обработчик удаления
  const handleDelete = async () => {
    if (!car) return;

    try {
      await carsApi.deleteCar(carId);
      toast.success('Автомобиль успешно удален');
      router.push('/cars');
    } catch (err) {
      console.error('Ошибка удаления автомобиля:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления автомобиля');
    }
  };

  // Обработчик добавления водителя
  const handleAddDriver = async (driverId: string) => {
    if (!car) return;

    try {
      await carsApi.assignDriver(carId, driverId);
      toast.success('Водитель успешно назначен');

      // Перезагружаем данные автомобиля
      const carData = await carsApi.getCarById(carId);
      setCar(carData);
    } catch (err) {
      console.error('Ошибка назначения водителя:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка назначения водителя');
      throw err; // Пробрасываем ошибку для обработки в модальном окне
    }
  };

  // Обработчик удаления водителя
  const handleRemoveDriver = async (driverId: string) => {
    if (!car) return;

    try {
      await carsApi.removeDriver(carId, driverId);
      toast.success('Водитель успешно удален');

      // Перезагружаем данные автомобиля
      const carData = await carsApi.getCarById(carId);
      setCar(carData);
    } catch (err) {
      console.error('Ошибка удаления водителя:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления водителя');
      throw err;
    }
  };

  // Обработчик обновления изображения
  const handleUpdateImage = async (item: CarImageItem) => {
    if (!car) return;

    let image: string | null = null;
    if (item === null) {
      image = null;
    } else if (item.kind === 'existing') {
      image = item.id;
    } else if (!item.error) {
      image = await filesApi.uploadFile('CarImage', item.file);
    }

    await carsApi.updateCar(carId, { image });
    toast.success('Фотография автомобиля обновлена');

    const carData = await carsApi.getCarById(carId);
    setCar(carData);
  };

  // Обработчик обновления опций
  const handleUpdateFeatures = async (features: CarFeature[]) => {
    if (!car) return;

    try {
      await carsApi.updateCar(carId, {
        ...car,
        features
      });
      toast.success('Опции автомобиля успешно обновлены');

      // Перезагружаем данные автомобиля
      const carData = await carsApi.getCarById(carId);
      setCar(carData);
    } catch (err) {
      console.error('Ошибка обновления опций:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления опций');
      throw err;
    }
  };

  if (loading) {
    return <CarViewLoading />;
  }

  if (error) {
    return (
      <CarViewError 
        error={error} 
        onRetry={() => window.location.reload()}
        onBack={handleBackToList}
      />
    );
  }

  if (!car) {
    return (
      <CarViewError 
        error="Автомобиль не найден" 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className='pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white flex flex-col gap-6 p-6 overflow-y-auto'>
      {/* Заголовок */}
      <CarViewHeader car={car} />

      {/* Двухколоночный layout */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Левая колонка - основная информация (3/4 ширины) */}
        <div className='lg:col-span-3'>
          <CarViewContent
            car={car}
            onRemoveDriver={handleRemoveDriver}
            onAddFeature={() => setIsManageFeaturesModalOpen(true)}
            onUpdateImage={handleUpdateImage}
          />
        </div>

        {/* Правая колонка - кнопки действий (1/4 ширины) */}
        <div className='lg:col-span-1'>
          <CarViewActions
            car={car}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBack={handleBackToList}
            onAddDriver={() => setIsAddDriverModalOpen(true)}
            onManageFeatures={() => setIsManageFeaturesModalOpen(true)}
          />
        </div>
      </div>

      {/* Модальное окно добавления водителя */}
      <AddDriverModal
        isOpen={isAddDriverModalOpen}
        onClose={() => setIsAddDriverModalOpen(false)}
        onAddDriver={handleAddDriver}
        assignedDriverIds={car.drivers.map(driver => driver.driverId)}
      />

      {/* Модальное окно управления опциями */}
      <ManageFeaturesModal
        isOpen={isManageFeaturesModalOpen}
        onClose={() => setIsManageFeaturesModalOpen(false)}
        car={car}
        onUpdateFeatures={handleUpdateFeatures}
      />
    </div>
  );
}
