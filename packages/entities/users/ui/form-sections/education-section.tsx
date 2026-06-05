'use client';

import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout';

interface EducationFormData {
  profile: {
    education: Array<{
      institution: string;
      degree?: string | null;
      fieldOfStudy?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      isCompleted: boolean;
    }>;
  };
}

export function EducationSection() {
  const { register, control, formState: { errors }, watch } = useFormContext<EducationFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'profile.education',
  });

  const addEntry = () => {
    append({
      institution: '',
      degree: null,
      fieldOfStudy: null,
      startDate: null,
      endDate: null,
      isCompleted: false,
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium flex items-center gap-2'>
          <GraduationCap className='h-5 w-5 text-blue-600' />
          Образование
        </h3>
        <Button type='button' variant='outline' size='sm' onClick={addEntry} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Добавить
        </Button>
      </div>

      {fields.length === 0 && (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
            <GraduationCap className='h-12 w-12 text-gray-400 mb-4' />
            <p className='text-gray-500 mb-4'>Нет записей об образовании</p>
            <Button type='button' variant='outline' onClick={addEntry} className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              Добавить запись
            </Button>
          </CardContent>
        </Card>
      )}

      <div className='space-y-4'>
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className='pb-4'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base flex items-center gap-2'>
                  <GraduationCap className='h-4 w-4' />
                  Учебное заведение #{index + 1}
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
                <div className='md:col-span-2 space-y-2'>
                  <Label>Учебное заведение *</Label>
                  <Input
                    {...register(`profile.education.${index}.institution`)}
                    placeholder='Название учебного заведения'
                    className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow ${
                      errors.profile?.education?.[index]?.institution ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.profile?.education?.[index]?.institution && (
                    <p className='text-sm text-red-500'>
                      {errors.profile.education[index]?.institution?.message}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label>Степень / квалификация</Label>
                  <Input
                    {...register(`profile.education.${index}.degree`)}
                    placeholder='Бакалавр, Магистр...'
                    className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Специальность</Label>
                  <Input
                    {...register(`profile.education.${index}.fieldOfStudy`)}
                    placeholder='Специальность'
                    className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Дата начала</Label>
                  <Input
                    type='date'
                    {...register(`profile.education.${index}.startDate`)}
                    className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Дата окончания</Label>
                  <Input
                    type='date'
                    {...register(`profile.education.${index}.endDate`)}
                    className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'
                  />
                </div>

                <div className='flex items-center gap-3 md:col-span-2'>
                  <input
                    type='checkbox'
                    id={`isCompleted-${index}`}
                    {...register(`profile.education.${index}.isCompleted`)}
                    className='h-4 w-4 rounded border-gray-300 cursor-pointer'
                  />
                  <Label htmlFor={`isCompleted-${index}`} className='cursor-pointer font-normal'>
                    Обучение завершено
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
