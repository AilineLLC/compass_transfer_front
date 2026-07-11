'use client';

import { FormProvider } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent } from '@shared/ui/layout';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { Label } from '@shared/ui/forms/label';
import { Input } from '@shared/ui/forms/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import dynamic from 'next/dynamic';
import { AREA_FORM_CHAPTERS } from '@entities/areas/model/form-chapters/area-chapters';
import { KYRGYZSTAN_REGIONS } from '@shared/constants/kyrgyzstan-regions';
import type { useAreaEditForm } from '@features/areas/forms/edit/area-edit-form';
import { calcCentroid, polyToPositions } from '@shared/ui/maps/area-drawing-map';

const AreaDrawingMap = dynamic(
  () => import('@shared/ui/maps/area-drawing-map').then(m => m.AreaDrawingMap),
  { ssr: false, loading: () => <div className='h-[500px] bg-gray-100 rounded-lg animate-pulse' /> },
);

type AreaEditViewProps = ReturnType<typeof useAreaEditForm>;

export function AreaEditView({
  form,
  isSubmitting,
  errors,
  watch,
  getChapterStatus,
  getChapterErrors,
  onSave,
  handleChapterClick,
  onBack,
}: AreaEditViewProps) {
  const poly = watch('poly') as number[];

  const handlePolyChange = (newPoly: number[]) => {
    form.setValue('poly', newPoly, { shouldValidate: true });
    if (newPoly.length >= 6) {
      const [lat, lng] = calcCentroid(polyToPositions(newPoly));
      form.setValue('latitude', lat);
      form.setValue('longitude', lng);
    }
  };

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
                    <div className='flex flex-col gap-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='name'>Название области *</Label>
                          <Input
                            id='name'
                            placeholder='Введите название области'
                            {...form.register('name')}
                          />
                          {errors.name && <p className='text-sm text-red-600'>{errors.name.message}</p>}
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='city'>Город / область *</Label>
                          <Select
                            value={watch('city')}
                            onValueChange={val => form.setValue('city', val, { shouldValidate: true })}
                          >
                            <SelectTrigger id='city' className='h-10'>
                              <SelectValue placeholder='Выберите город' />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(KYRGYZSTAN_REGIONS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.city && <p className='text-sm text-red-600'>{errors.city.message}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Глава 2: Карта */}
                <div id='chapter-map' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={2} title='Область на карте' status={getChapterStatus('map')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <div className='flex flex-col gap-2'>
                      <p className='text-sm text-muted-foreground'>
                        Редактируйте границы области. Центр (lat/lng) вычисляется автоматически.
                      </p>
                      <AreaDrawingMap poly={poly} onChange={handlePolyChange} height='500px' />
                      {errors.poly && <p className='text-sm text-red-600'>{errors.poly.message}</p>}
                    </div>
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
            title='Редактирование области'
            chapters={AREA_FORM_CHAPTERS.EDIT}
            getChapterStatus={getChapterStatus}
            getChapterErrors={getChapterErrors}
            onUpdate={onSave}
            isSubmitting={isSubmitting}
            onBack={onBack}
            onChapterClick={handleChapterClick}
            updateButtonText='Сохранить изменения'
          />
        </div>
      </div>
    </FormProvider>
  );
}
