import type { MutableRefObject } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import {
  LocationBasicSection,
  LocationCoordinatesSection,
  LocationMapSection,
  LocationProfileSection,
} from '@entities/locations';
import type { ImageItem, PoiItemState, AdviceImageItem } from '@entities/locations';
import { LOCATION_FORM_CHAPTERS } from '@entities/locations/model/form-chapters/location-chapters';
import type { LocationCreateFormData } from '@entities/locations/schemas/locationCreateSchema';

interface LocationFormViewProps {
  form: UseFormReturn<LocationCreateFormData>;
  isSubmitting: boolean;
  imageItemsRef: MutableRefObject<ImageItem[]>;
  poiItemsRef: MutableRefObject<PoiItemState[]>;
  onAdviceImageChange: (item: AdviceImageItem | null) => void;
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
  onAdviceImageChange,
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
                  <ChapterHeader number={1} title='Основная информация' status={getChapterStatus('basic')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationBasicSection
                      labels={{ name: 'Название локации *', type: 'Тип локации *', group: 'Группа локации' }}
                    />
                  </div>
                </div>

                {/* Глава 2: Карта */}
                <div id='chapter-map' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={2} title='Местоположение на карте' status={getChapterStatus('map')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationMapSection labels={{ coordinates: 'Местоположение на карте *' }} />
                  </div>
                </div>

                {/* Глава 3: Настройки */}
                <div id='chapter-settings' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={3} title='Настройки' status={getChapterStatus('settings')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationCoordinatesSection
                      labels={{
                        isActive: 'Активная локация',
                        popular: 'Топ точки (отображается в начале списка терминала)',
                      }}
                    />
                  </div>
                </div>

                {/* Глава 4: Профиль локации */}
                <div id='chapter-profile' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={4} title='Профиль локации' status='pending' />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <LocationProfileSection
                      onImagesChange={items => { imageItemsRef.current = items; }}
                      onPoiChange={items => { poiItemsRef.current = items; }}
                      onAdviceImageChange={onAdviceImageChange}
                    />
                  </div>
                </div>

                <div className='flex justify-end space-x-4 pt-6'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={onBack}
                    disabled={isSubmitting}
                    className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'
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
