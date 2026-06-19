'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { locationsApi } from '@shared/api/locations';
import type { LocationDTO } from '@entities/locations/interface';
import { LocationViewHeader } from './components/location-view-header';
import { LocationViewActions } from './components/location-view-actions';
import { LocationViewContent } from './components/location-view-content';
import { LocationViewLoading } from './components/location-view-loading';
import { LocationViewError } from './components/location-view-error';

interface LocationViewProps {
  locationId: string;
}

export function LocationView({ locationId }: LocationViewProps) {
  const router = useRouter();
  const [location, setLocation] = useState<LocationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных локации
  useEffect(() => {
    const loadLocation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const locationData = await locationsApi.getLocationById(locationId);
        setLocation(locationData);
      } catch (err) {
        console.error('Ошибка загрузки локации:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки локации');
      } finally {
        setLoading(false);
      }
    };

    if (locationId) {
      loadLocation();
    }
  }, [locationId]);

  // Обработчик возврата к списку
  const handleBackToList = () => {
    router.push('/locations');
  };

  // Обработчик редактирования
  const handleEdit = () => {
    router.push(`/locations/edit/${locationId}`);
  };

  // Обработчик удаления
  const handleDelete = async () => {
    if (!location) return;

    try {
      await locationsApi.deleteLocation(locationId);
      toast.success('Локация успешно удалена');
      router.push('/locations');
    } catch (err) {
      console.error('Ошибка удаления локации:', err);
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления локации');
    }
  };

  if (loading) {
    return <LocationViewLoading />;
  }

  if (error) {
    return (
      <LocationViewError 
        error={error} 
        onRetry={() => window.location.reload()}
        onBack={handleBackToList}
      />
    );
  }

  if (!location) {
    return (
      <LocationViewError 
        error="Локация не найдена" 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className='pr-2 border rounded-2xl overflow-auto shadow-sm h-full bg-white flex flex-col gap-6 p-6'>
      {/* Заголовок */}
      <LocationViewHeader location={location} />

      {/* Двухколоночный layout */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Левая колонка - основная информация (3/4 ширины) */}
        <div className='lg:col-span-3'>
          <LocationViewContent location={location} />
        </div>

        {/* Правая колонка - кнопки действий (1/4 ширины) */}
        <div className='lg:col-span-1'>
          <LocationViewActions
            location={location}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBack={handleBackToList}
          />
        </div>
      </div>
    </div>
  );
}
