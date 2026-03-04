'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Phone, Lock, Car } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { useDriverAuth } from '@features/driver-auth';

// Схема валидации формы
const driverLoginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Введите номер телефона')
    .refine(
      (val) => val.length >= 14 && /^\+996 \d{3} \d{3} \d{3}$/.test(val),
      'Введите полный номер телефона в формате +996 XXX XXX XXX'
    ),
  password: z
    .string()
    .min(1, 'Введите пароль')
    .min(3, 'Пароль должен содержать минимум 3 символа'),
  licensePlate: z
    .string()
    .min(1, 'Введите госномер автомобиля')
    .max(15, 'Госномер слишком длинный'),
});

type DriverLoginFormData = z.infer<typeof driverLoginSchema>;

export function DriverLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [phoneValue, setPhoneValue] = useState('+996 ');
  const { isLoading, actions } = useDriverAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DriverLoginFormData>({
    resolver: zodResolver(driverLoginSchema),
    defaultValues: {
      phoneNumber: '+996 ',
      password: '',
      licensePlate: '',
    },
  });

  // Функция для форматирования номера телефона
  const formatPhoneNumber = (value: string) => {
    // Убираем все кроме цифр
    const digits = value.replace(/\D/g, '');
    
    // Если пытаются удалить префикс 996, возвращаем минимальный формат
    if (digits.length < 3 || !digits.startsWith('996')) {
      return '+996 ';
    }
    
    // Форматируем: +996 XXX XXX XXX
    const phone = digits.substring(3); // Убираем 996
    let formatted = '+996 ';
    
    if (phone.length > 0) {
      formatted += phone.substring(0, 3);
    }
    if (phone.length > 3) {
      formatted += ' ' + phone.substring(3, 6);
    }
    if (phone.length > 6) {
      formatted += ' ' + phone.substring(6, 9);
    }
    
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Не позволяем удалять префикс +996
    if (inputValue.length < 5) {
      setPhoneValue('+996 ');
      setValue('phoneNumber', '+996 ');

      return;
    }
    
    const formatted = formatPhoneNumber(inputValue);

    setPhoneValue(formatted);
    setValue('phoneNumber', formatted);
  };

  const onSubmit = async (data: DriverLoginFormData) => {
    try {
      // Убираем пробелы из номера телефона для отправки на сервер
      const cleanPhoneNumber = data.phoneNumber.replace(/\s/g, '');
      
      await actions.login({
        phoneNumber: cleanPhoneNumber,
        password: data.password,
        licensePlate: data.licensePlate?.toUpperCase(),
      });
    } catch {
      // Ошибка уже обработана в хуке
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 safe-area'>
      <Card className='w-full max-w-sm shadow-2xl rounded-3xl border-0'>
        <CardHeader className='text-center pb-6 pt-8'>
          <CardTitle className='text-3xl font-bold text-gray-900 mb-2'>
            Compass Driver
          </CardTitle>
          <p className='text-gray-600 text-base font-medium'>
            Вход для водителей
          </p>
        </CardHeader>

        <CardContent className='px-6 pb-8'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
            {/* Номер телефона */}
            <div className='space-y-3'>
              <Label htmlFor='phoneNumber' className='text-base font-semibold text-gray-700'>Номер телефона</Label>
              <div className='relative'>
                <Phone className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='phoneNumber'
                  type='tel'
                  placeholder='+996 700 123 456'
                  className='pl-12 h-14 text-base rounded-xl border-2 focus:border-blue-500'
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  onKeyDown={(e) => {
                    // Предотвращаем удаление префикса +996
                    const target = e.target as HTMLInputElement;
                    const cursorPosition = target.selectionStart || 0;
                    
                    if (e.key === 'Backspace' && cursorPosition <= 5) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              {errors.phoneNumber && (
                <p className='text-sm text-red-600 font-medium'>{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Пароль */}
            <div className='space-y-3'>
              <Label htmlFor='password' className='text-base font-semibold text-gray-700'>Пароль</Label>
              <div className='relative'>
                <Lock className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Введите пароль'
                  className='pl-12 pr-12 h-14 text-base rounded-xl border-2 focus:border-blue-500'
                  {...register('password')}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1'
                >
                  {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </button>
              </div>
              {errors.password && (
                <p className='text-sm text-red-600 font-medium'>{errors.password.message}</p>
              )}
            </div>

            {/* Госномер */}
            <div className='space-y-3'>
              <Label htmlFor='licensePlate' className='text-base font-semibold text-gray-700'>Госномер</Label>
              <div className='relative'>
                <Car className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='licensePlate'
                  type='text'
                  placeholder='01KG123ABC'
                  className='pl-12 h-14 text-base rounded-xl border-2 focus:border-blue-500 uppercase'
                  {...register('licensePlate')}
                />
              </div>
              {errors.licensePlate && (
                <p className='text-sm text-red-600 font-medium'>{errors.licensePlate.message}</p>
              )}
            </div>



            {/* Кнопка входа */}
            <Button
              type='submit'
              disabled={isLoading}
              className='w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all duration-200 active:scale-95 mt-6'
            >
              {isLoading ? (
                <div className='flex items-center gap-3'>
                  <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  <span>Вход...</span>
                </div>
              ) : (
                'Войти'
              )}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  );
}
