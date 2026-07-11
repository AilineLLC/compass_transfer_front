'use client';

import { Controller, FormProvider, type UseFormReturn } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Switch } from '@shared/ui/forms/switch';
import { LocationSelect } from '@shared/ui/forms/location-select';
import { Card, CardContent } from '@shared/ui/layout/card';
import { ChapterHeader } from '@shared/ui/layout/chapter-header';
import { FormSidebar } from '@shared/ui/layout/form-sidebar';
import { RoutePricesSection } from '@features/routes/ui/route-prices-section';
import type { RouteEditFormData } from '@features/routes/forms/edit/route-edit-form';

const ROUTE_EDIT_CHAPTERS = [
  { id: 'basic', title: 'Основная информация', description: 'Название и параметры маршрута' },
  { id: 'locations', title: 'Точки маршрута', description: 'Начальная и конечная точки' },
] as const;

interface RouteEditViewProps {
  form: UseFormReturn<RouteEditFormData>;
  isSubmitting: boolean;
  isLoadingRoute: boolean;
  onUpdate: () => void;
  onBack: () => void;
}

export function RouteEditView({ form, isSubmitting, isLoadingRoute, onUpdate, onBack }: RouteEditViewProps) {
  const { register, control, setValue, watch, formState: { errors } } = form;
  const startLocationId = watch('startLocationId');
  const endLocationId = watch('endLocationId');

  const getChapterStatus = (id: string): 'complete' | 'warning' | 'error' | 'pending' => {
    if (id === 'basic') {
      if (errors.name || errors.prices || errors.duration) return 'error';
      return 'pending';
    }
    if (id === 'locations') {
      if (errors.startLocationId || errors.endLocationId) return 'error';
      return 'pending';
    }
    return 'pending';
  };

  const getChapterErrors = (id: string): string[] => {
    const errs: string[] = [];
    if (id === 'basic') {
      if (errors.name?.message) errs.push(errors.name.message);
      if (errors.duration?.message) errs.push(errors.duration.message);
    }
    if (id === 'locations') {
      if (errors.startLocationId?.message) errs.push(errors.startLocationId.message);
      if (errors.endLocationId?.message) errs.push(errors.endLocationId.message);
    }
    return errs;
  };

  if (isLoadingRoute) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-muted-foreground'>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className='flex overflow-hidden h-full pb-2'>
        <div className='shadow-md flex-1 h-full p-4 overflow-auto border bg-white rounded-2xl'>
          <Card className='flex flex-col pr-4'>
            <CardContent className='p-0'>
              <form className='flex flex-col gap-6 pb-6'>
                {/* Глава 1: Основная информация */}
                <div id='chapter-basic' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={1} title='Основная информация' status={getChapterStatus('basic')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <div className='flex flex-col gap-4'>
                      <div className='flex flex-col gap-1.5'>
                        <Label htmlFor='name'>Название маршрута *</Label>
                        <Input
                          id='name'
                          {...register('name')}
                          placeholder='Например: Бишкек — Ош'
                          className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md transition-shadow ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
                      </div>

                      <div className='flex flex-col gap-1.5'>
                        <Label htmlFor='duration'>Длительность (мин) *</Label>
                        <Input
                          id='duration'
                          type='number'
                          min={0}
                          step={1}
                          {...register('duration', { valueAsNumber: true })}
                          placeholder='0'
                          className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md transition-shadow ${errors.duration ? 'border-red-500' : ''}`}
                        />
                        {errors.duration && <p className='text-sm text-red-500'>{errors.duration.message}</p>}
                      </div>

                      <RoutePricesSection />

                      <div className='flex items-center gap-3'>
                        <Controller
                          name='isPopular'
                          control={control}
                          render={({ field }) => (
                            <Switch
                              id='isPopular'
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label htmlFor='isPopular' className='cursor-pointer'>Популярное направление</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Глава 2: Точки маршрута */}
                <div id='chapter-locations' className='relative flex flex-col gap-4'>
                  <ChapterHeader number={2} title='Точки маршрута' status={getChapterStatus('locations')} />
                  <div className='relative ml-12'>
                    <div className='absolute -left-8 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-gray-300' />
                    <div className='flex flex-col gap-4'>
                      <div className='flex flex-col gap-1.5'>
                        <Label>Точка А (начальная) *</Label>
                        <LocationSelect
                          value={startLocationId || null}
                          onValueChange={val => setValue('startLocationId', val ?? '', { shouldDirty: true })}
                          placeholder='Выберите начальную локацию'
                          isLandingOnly
                          error={!!errors.startLocationId}
                        />
                        {errors.startLocationId && (
                          <p className='text-sm text-red-500'>{errors.startLocationId.message}</p>
                        )}
                      </div>

                      <div className='flex flex-col gap-1.5'>
                        <Label>Точка Б (конечная) *</Label>
                        <LocationSelect
                          value={endLocationId || null}
                          onValueChange={val => setValue('endLocationId', val ?? '', { shouldDirty: true })}
                          placeholder='Выберите конечную локацию'
                          isLandingOnly
                          error={!!errors.endLocationId}
                        />
                        {errors.endLocationId && (
                          <p className='text-sm text-red-500'>{errors.endLocationId.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex justify-end pt-4'>
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
            title='Редактирование направления'
            chapters={ROUTE_EDIT_CHAPTERS}
            getChapterStatus={getChapterStatus}
            getChapterErrors={getChapterErrors}
            onUpdate={onUpdate}
            isSubmitting={isSubmitting}
            onBack={onBack}
            updateButtonText='Сохранить изменения'
          />
        </div>
      </div>
    </FormProvider>
  );
}
