'use client';

import { Plus, Trash2, Briefcase } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';

interface WorkExperienceFormData {
  profile: {
    workExperience: Array<{
      employerName: string;
      position: string;
      startDate: string;
      endDate: string | null;
      isCurrent: boolean;
      responsibilities: string | null;
    }>;
  };
}

export function WorkExperienceSection() {
  const { register, control, formState: { errors }, watch } = useFormContext<WorkExperienceFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'profile.workExperience',
  });

  const addEntry = () => {
    append({
      employerName: '',
      position: '',
      startDate: '',
      endDate: null,
      isCurrent: false,
      responsibilities: null,
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium flex items-center gap-2'>
          <Briefcase className='h-5 w-5 text-blue-600' />
          Опыт работы
        </h3>
        <Button type='button' variant='outline' size='sm' onClick={addEntry} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Добавить
        </Button>
      </div>

      {fields.length === 0 && (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
            <Briefcase className='h-12 w-12 text-gray-400 mb-4' />
            <p className='text-gray-500 mb-4'>Нет записей об опыте работы</p>
            <Button type='button' variant='outline' onClick={addEntry} className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              Добавить запись
            </Button>
          </CardContent>
        </Card>
      )}

      <div className='space-y-4'>
        {fields.map((field, index) => {
          const isCurrent = watch(`profile.workExperience.${index}.isCurrent`);
          return (
            <Card key={field.id}>
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base flex items-center gap-2'>
                    <Briefcase className='h-4 w-4' />
                    Место работы #{index + 1}
                  </CardTitle>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => remove(index)}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Работодатель *</Label>
                    <Input
                      {...register(`profile.workExperience.${index}.employerName`)}
                      placeholder='Название компании'
                      className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow ${
                        errors.profile?.workExperience?.[index]?.employerName ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.profile?.workExperience?.[index]?.employerName && (
                      <p className='text-sm text-red-500'>
                        {errors.profile.workExperience[index]?.employerName?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>Должность *</Label>
                    <Input
                      {...register(`profile.workExperience.${index}.position`)}
                      placeholder='Должность'
                      className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow ${
                        errors.profile?.workExperience?.[index]?.position ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.profile?.workExperience?.[index]?.position && (
                      <p className='text-sm text-red-500'>
                        {errors.profile.workExperience[index]?.position?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>Дата начала *</Label>
                    <Input
                      type='date'
                      {...register(`profile.workExperience.${index}.startDate`)}
                      className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow ${
                        errors.profile?.workExperience?.[index]?.startDate ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.profile?.workExperience?.[index]?.startDate && (
                      <p className='text-sm text-red-500'>
                        {errors.profile.workExperience[index]?.startDate?.message}
                      </p>
                    )}
                  </div>

                  {!isCurrent && (
                    <div className='space-y-2'>
                      <Label>Дата окончания</Label>
                      <Input
                        type='date'
                        {...register(`profile.workExperience.${index}.endDate`)}
                        className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'
                      />
                    </div>
                  )}

                  <div className='flex items-center gap-3 md:col-span-2'>
                    <input
                      type='checkbox'
                      id={`isCurrent-${index}`}
                      {...register(`profile.workExperience.${index}.isCurrent`)}
                      className='h-4 w-4 rounded border-gray-300 cursor-pointer'
                    />
                    <Label htmlFor={`isCurrent-${index}`} className='cursor-pointer font-normal'>
                      Текущее место работы
                    </Label>
                  </div>

                  <div className='md:col-span-2 space-y-2'>
                    <Label>Обязанности</Label>
                    <textarea
                      {...register(`profile.workExperience.${index}.responsibilities`)}
                      placeholder='Опишите основные обязанности...'
                      rows={3}
                      className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow resize-none disabled:cursor-not-allowed disabled:opacity-50'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
