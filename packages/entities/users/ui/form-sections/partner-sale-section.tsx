'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';

export function PartnerSaleSection() {
    const {
        register,
        formState: { errors },
    } = useFormContext<{ sale: number | null }>();

    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label htmlFor='sale'>Скидка (%)</Label>
                    <Input
                        id='sale'
                        type='number'
                        {...register('sale', { valueAsNumber: true })}
                        placeholder='Например: 0.1'
                        step='0.01'
                        min='0'
                        max='1'
                        className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${errors.sale ? 'border-red-500' : ''
                            }`}
                    />
                    <p className='text-sm text-gray-500'>
                        Введите значение от 0 до 1. Например: 0.1 = 10%, 0.25 = 25%, 0.5 = 50%
                    </p>
                    {errors.sale && (
                        <p className='text-sm text-red-500'>
                            {typeof errors.sale.message === 'string'
                                ? errors.sale.message
                                : 'Ошибка валидации'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
