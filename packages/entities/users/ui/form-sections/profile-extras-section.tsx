'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@shared/ui/forms/button';
import { DatePicker } from '@shared/ui/forms/date-picker';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';

interface ProfileExtrasFormData {
  profile: {
    taxIdentifier?: string | null;
    profilePhoto?: string | null;
    totalRides?: number;
    totalDistance?: number;
    lastRideDate?: string | null;
    medicalExamDate?: string | null;
    backgroundCheckDate?: string | null;
    trainingCompleted?: boolean;
    preferredWorkZones?: string[];
  };
}

export function ProfileExtrasSection() {
  const { register, watch, setValue } = useFormContext<ProfileExtrasFormData>();
  const [newZone, setNewZone] = useState('');

  const workZones = watch('profile.preferredWorkZones') || [];
  const profile = watch('profile');

  const toDateString = (date: Date | undefined, field: string) => {
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setValue(field as never, `${y}-${m}-${d}`);
    } else {
      setValue(field as never, null);
    }
  };

  const lastRideDate = profile?.lastRideDate ? new Date(profile.lastRideDate) : undefined;
  const medicalExamDate = profile?.medicalExamDate ? new Date(profile.medicalExamDate) : undefined;
  const backgroundCheckDate = profile?.backgroundCheckDate ? new Date(profile.backgroundCheckDate) : undefined;

  const addZone = () => {
    const trimmed = newZone.trim();
    if (trimmed && !workZones.includes(trimmed)) {
      setValue('profile.preferredWorkZones', [...workZones, trimmed]);
      setNewZone('');
    }
  };

  const removeZone = (zone: string) => {
    setValue('profile.preferredWorkZones', workZones.filter((z: string) => z !== zone));
  };

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Дополнительная информация</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='taxIdentifier'>ИНН (налоговый номер)</Label>
          <Input
            id='taxIdentifier'
            {...register('profile.taxIdentifier')}
            placeholder='Введите налоговый идентификатор'
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='profilePhoto'>Фото профиля (URL)</Label>
          <Input
            id='profilePhoto'
            {...register('profile.profilePhoto')}
            placeholder='https://...'
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='totalRides'>Всего поездок</Label>
          <Input
            id='totalRides'
            type='number'
            min='0'
            {...register('profile.totalRides', { valueAsNumber: true })}
            placeholder='0'
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='totalDistance'>Общий пробег (км)</Label>
          <Input
            id='totalDistance'
            type='number'
            min='0'
            {...register('profile.totalDistance', { valueAsNumber: true })}
            placeholder='0'
            className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='lastRideDate'>Дата последней поездки</Label>
          <DatePicker
            id='lastRideDate'
            value={lastRideDate}
            onChange={date => toDateString(date, 'profile.lastRideDate')}
            placeholder='Выберите дату'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='medicalExamDate'>Дата медосмотра</Label>
          <DatePicker
            id='medicalExamDate'
            value={medicalExamDate}
            onChange={date => toDateString(date, 'profile.medicalExamDate')}
            placeholder='Выберите дату'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='backgroundCheckDate'>Дата проверки анкеты</Label>
          <DatePicker
            id='backgroundCheckDate'
            value={backgroundCheckDate}
            onChange={date => toDateString(date, 'profile.backgroundCheckDate')}
            placeholder='Выберите дату'
          />
        </div>

        <div className='space-y-2 flex flex-col justify-center'>
          <Label>Обучение пройдено</Label>
          <div className='flex items-center gap-3 h-10'>
            <input
              id='trainingCompleted'
              type='checkbox'
              {...register('profile.trainingCompleted')}
              className='h-4 w-4 rounded border-gray-300 cursor-pointer'
            />
            <Label htmlFor='trainingCompleted' className='cursor-pointer font-normal text-muted-foreground'>
              {watch('profile.trainingCompleted') ? 'Да' : 'Нет'}
            </Label>
          </div>
        </div>

        <div className='md:col-span-2 space-y-2'>
          <Label>Предпочтительные рабочие зоны</Label>
          <div className='flex gap-2'>
            <Input
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addZone();
                }
              }}
              placeholder='Добавить зону...'
              className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow'
            />
            <Button type='button' variant='outline' size='sm' onClick={addZone}>
              <Plus className='h-4 w-4' />
            </Button>
          </div>
          {workZones.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-2'>
              {workZones.map((zone: string) => (
                <span
                  key={zone}
                  className='inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm'
                >
                  {zone}
                  <button
                    type='button'
                    onClick={() => removeZone(zone)}
                    className='text-gray-500 hover:text-red-500'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
