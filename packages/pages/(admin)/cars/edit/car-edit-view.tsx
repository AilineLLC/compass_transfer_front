'use client';

import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { carsApi } from '@shared/api/cars';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { CarBasicSection, CarFeaturesSection, CarImagesSection, type CarImagesItem } from '@entities/cars';
import { VehicleStatus, VehicleType, CarColor } from '@entities/cars/enums';
import type { GetCarDTO } from '@entities/cars/interface';
import { CAR_FORM_CHAPTERS } from '@entities/cars/model/form-chapters/car-chapters';
import type { CarUpdateFormData } from '@entities/cars/schemas/carUpdateSchema';
import { ServiceClass } from '@entities/shared/types';
import { useCarEditFormLogic } from '@features/cars/forms/edit/car-edit-form';

interface CarEditViewProps {
  carId: string;
}

interface CarEditFormViewProps {
  form: UseFormReturn<CarUpdateFormData>;
  isSubmitting: boolean;
  imageItemsRef: React.MutableRefObject<CarImagesItem[]>;
  existingImages: { id: string; path: string }[];
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onUpdate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function CarEditView({ carId }: CarEditViewProps) {
  const router = useRouter();
  const [car, setCar] = useState<GetCarDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные автомобиля
  useEffect(() => {
    const loadCar = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const carData = await carsApi.getCarById(carId);

        setCar(carData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    if (carId) {
      loadCar();
    }
  }, [carId]);

  // Всегда вызываем хук, но с условными данными
  const logic = useCarEditFormLogic({
    carId: carId,
    initialData: {
      make: '',
      model: '',
      year: 2022,
      color: CarColor.White,
      licensePlate: '',
      type: VehicleType.Sedan,
      serviceClass: ServiceClass.Economy,
      status: VehicleStatus.Available,
      passengerCapacity: 4,
      features: [],
    },
    onBack: () => router.push('/cars'),
    onSuccess: () => router.push('/cars'),
  });

  // Заполняем форму через useLayoutEffect с reset()
  useLayoutEffect(() => {
    if (car && logic.form) {
      logic.form.reset({
        id: car.id,
        make: car.make || '',
        model: car.model || '',
        year: car.year || 2022,
        color: car.color,
        licensePlate: car.licensePlate || '',
        type: car.type,
        serviceClass: car.serviceClass,
        status: car.status,
        passengerCapacity: car.passengerCapacity || 4,
        features: car.features || [],
      });
      // Инициализируем ref изображений
      logic.imageItemsRef.current = (car.images ?? []).map(img => ({
        kind: 'existing' as const,
        id: img.id,
        path: img.path,
      }));
    }
  }, [car, logic.form, logic.imageItemsRef]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4' />
          <p>Загрузка данных автомобиля...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    notFound();
  }

  return <CarEditFormView {...logic} existingImages={car!.images ?? []} />;
}

function CarEditFormView({
  form,
  isSubmitting,
  imageItemsRef,
  existingImages,
  getChapterStatus,
  getChapterErrors,
  onUpdate,
  handleChapterClick,
  onBack,
}: CarEditFormViewProps) {
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
                    <CarBasicSection
                      showOptionalWarning={getChapterStatus('basic') === 'warning'}
                      labels={{
                        make: 'Марка автомобиля *',
                        model: 'Модель автомобиля *',
                        year: 'Год выпуска *',
                        color: 'Цвет автомобиля *',
                        licensePlate: 'Государственный номер *',
                        type: 'Тип автомобиля *',
                        serviceClass: 'Класс обслуживания *',
                        status: 'Статус автомобиля *',
                        passengerCapacity: 'Пассажировместимость *',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 2: Дополнительные опции */}
                <div id='chapter-features' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={2}
                    title='Дополнительные опции'
                    status={getChapterStatus('features')}
                  />
                  <div className='relative ml-12'>
                    {/* Вертикальная линия */}
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <CarFeaturesSection
                      labels={{
                        features: 'Дополнительные опции *',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 3: Фотографии */}
                <div id='chapter-image' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={3}
                    title='Фотографии'
                    status='pending'
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <CarImagesSection
                      existingImages={existingImages}
                      onItemsChange={items => { imageItemsRef.current = items; }}
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
            chapters={CAR_FORM_CHAPTERS.EDIT}
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
