import type { MutableRefObject } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { CarBasicSection, CarFeaturesSection, CarImagesSection, type CarImagesItem } from '@entities/cars';
import { CAR_FORM_CHAPTERS } from '@entities/cars/model/form-chapters/car-chapters';
import type { CarCreateFormData } from '@entities/cars/schemas/carCreateSchema';

interface CarFormViewProps {
  form: UseFormReturn<CarCreateFormData>;
  isSubmitting: boolean;
  imageItemsRef: MutableRefObject<CarImagesItem[]>;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onCreate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function CarFormView({
  form,
  isSubmitting,
  imageItemsRef,
  getChapterStatus,
  getChapterErrors,
  onCreate,
  handleChapterClick,
  onBack,
}: CarFormViewProps) {
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
                      placeholders={{
                        make: 'Toyota',
                        model: 'Camry',
                        year: '2022',
                        licensePlate: '01KG123ABC',
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
                      onItemsChange={items => { imageItemsRef.current = items; }}
                    />
                  </div>
                </div>

                <div className='flex justify-end space-x-4 pt-6'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={onBack}
                    disabled={isSubmitting}
                    className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className='w-80 flex-shrink-0 flex flex-col h-full'>
          <FormSidebar
            title='Создание автомобиля'
            chapters={CAR_FORM_CHAPTERS.CREATE}
            getChapterStatus={getChapterStatus}
            getChapterErrors={getChapterErrors}
            onCreate={onCreate}
            isSubmitting={isSubmitting}
            onBack={onBack}
            onChapterClick={handleChapterClick}
          />
        </div>
      </div>
    </FormProvider>
  );
}
