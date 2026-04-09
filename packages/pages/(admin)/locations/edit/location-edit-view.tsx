'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { locationsApi } from '@shared/api/locations';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { LocationBasicSection, LocationCoordinatesSection, LocationMapSection } from '@entities/locations';
import { LocationType } from '@entities/locations/enums';
import type { LocationDTO } from '@entities/locations/interface';
import { LOCATION_FORM_CHAPTERS } from '@entities/locations/model/form-chapters/location-chapters';
import type { LocationUpdateFormData } from '@entities/locations/schemas/locationUpdateSchema';
import { useLocationEditFormLogic } from '@features/locations/forms/edit/location-edit-form';

interface LocationEditViewProps {
  locationId: string;
}

interface LocationEditFormViewProps {
  form: UseFormReturn<LocationUpdateFormData>;
  isSubmitting: boolean;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onUpdate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function LocationEditView({ locationId }: LocationEditViewProps) {
  const router = useRouter();
  const [location, setLocation] = useState<LocationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные локации
  useEffect(() => {
    const loadLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const locationData = await locationsApi.getLocationById(locationId);

        setLocation(locationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    if (locationId) {
      loadLocation();
    }
  }, [locationId]);

  // Всегда вызываем хук, но с условными данными
  const logic = useLocationEditFormLogic({
    locationId: locationId,
    initialData: {
      name: '',
      description: '',
      type: LocationType.Airport,
      address: '',
      latitude: 0,
      longitude: 0,
      isActive: true,
      popular: false,
      popular2: false,
      isLandingOnly: false,
      group: null,
    },
    onBack: () => router.push('/locations'),
    onSuccess: () => router.push('/locations'),
  });

  // Заполняем форму через useLayoutEffect с reset()
  useLayoutEffect(() => {
    if (location && logic.form) {
      logic.form.reset({
        name: location.name || '',
        type: location.type,
        address: location.address || '',
        latitude: location.latitude || 0,
        longitude: location.longitude || 0,
        isActive: location.isActive ?? true,
        popular: location.popular1 ?? false,
        popular2: location.popular2 ?? false,
        isLandingOnly: location.isLandingOnly ?? false,
        group: location.group || '',
      });
    }
  }, [location, logic.form]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
          <p>Загрузка данных локации...</p>
        </div>
      </div>
    );
  }

  if (error || !location) {
    notFound();
  }

  return <LocationEditFormView {...logic} />;
}

function LocationEditFormView({
  form,
  isSubmitting,
  getChapterStatus,
  getChapterErrors,
  onUpdate,
  handleChapterClick,
  onBack,
}: LocationEditFormViewProps) {
  return (
    <FormProvider {...form}>
      <div className='flex overflow-hidden h-full pb-2'>
        <div className='shadow-md flex-1 h-full p-4 overflow-auto border bg-white rounded-2xl md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-[0_10px_40px_rgba(255,255,255,0.3)]'>
          <Card className='h-full flex flex-col overflow-auto pr-4'>
            <CardContent className='p-0'>
              <form className='flex flex-col gap-4'>
                {/* Глава 1: Основная информация */}
                <div id='chapter-basic' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={1}
                    title='Основная информация'
                    status={getChapterStatus('basic')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationBasicSection
                      labels={{
                        name: 'Название локации *',
                        type: 'Тип локации *',
                        group: 'Группа локации',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 2: Местоположение на карте */}
                <div id='chapter-map' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Местоположение на карте'
                    status={getChapterStatus('map')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationMapSection
                      labels={{
                        coordinates: 'Местоположение на карте *',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 3: Настройки локации */}
                <div id='chapter-settings' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={3}
                    title='Настройки локации'
                    status={getChapterStatus('coordinates')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationCoordinatesSection
                      labels={{
                        isActive: 'Активная локация',
                        popular: 'Локация которая показывается в терминале в начале (Топ точки)',
                      }}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className='w-80 flex-shrink-0 flex flex-col h-full'>
          {/* Сайдбар */}
          <FormSidebar
            chapters={LOCATION_FORM_CHAPTERS.EDIT}
            getChapterStatus={getChapterStatus}
            getChapterErrors={getChapterErrors}
            onChapterClick={handleChapterClick}
            onUpdate={onUpdate}
            isSubmitting={isSubmitting}
            onBack={onBack}
          />
        </div>
      </div>
    </FormProvider>
  );
}
