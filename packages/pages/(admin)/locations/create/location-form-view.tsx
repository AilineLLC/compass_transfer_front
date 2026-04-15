import type { MutableRefObject } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { LocationBasicSection, LocationCoordinatesSection, LocationImagesSection, LocationMapSection, LocationPoiSection } from '@entities/locations';
import type { ImageItem, PoiItemState } from '@entities/locations';
import { LOCATION_FORM_CHAPTERS } from '@entities/locations/model/form-chapters/location-chapters';
import type { LocationCreateFormData } from '@entities/locations/schemas/locationCreateSchema';

interface LocationFormViewProps {
  form: UseFormReturn<LocationCreateFormData>;
  isSubmitting: boolean;
  imageItemsRef: MutableRefObject<ImageItem[]>;
  poiItemsRef: MutableRefObject<PoiItemState[]>;
  getChapterStatus: (chapterId: string) => 'complete' | 'warning' | 'error' | 'pending';
  getChapterErrors: (chapterId: string) => string[];
  onCreate: () => void;
  handleChapterClick: (chapterId: string) => void;
  onBack: () => void;
}

export function LocationFormView({
  form,
  isSubmitting,
  imageItemsRef,
  poiItemsRef,
  getChapterStatus,
  getChapterErrors,
  onCreate,
  handleChapterClick,
  onBack,
}: LocationFormViewProps) {
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

                {/* Глава 4: Картинки локации */}
                <div id='chapter-images' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={4}
                    title='Картинки локации'
                    status='pending'
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationImagesSection
                      onItemsChange={items => { imageItemsRef.current = items; }}
                    />
                  </div>
                </div>

                {/* Глава 5: Интересные места */}
                <div id='chapter-poi' className='relative flex flex-col gap-4'>
                  <ChapterHeader
                    number={5}
                    title='Интересные места'
                    status='pending'
                  />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationPoiSection
                      onItemsChange={items => { poiItemsRef.current = items; }}
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
            title='Создание локации'
            chapters={LOCATION_FORM_CHAPTERS.CREATE}
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
