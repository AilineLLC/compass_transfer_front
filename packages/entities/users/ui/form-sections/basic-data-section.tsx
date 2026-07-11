'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/forms/select';
import { VerificationStatus } from '@entities/users/enums';

interface BasicFormData {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  verificationStatus?: string;
}

const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VerificationStatus.Pending]: 'Ожидает проверки',
  [VerificationStatus.Verified]: 'Верифицирован',
  [VerificationStatus.Rejected]: 'Отклонён',
  [VerificationStatus.InReview]: 'На проверке',
  [VerificationStatus.Expired]: 'Истёк',
};

interface BasicDataSectionProps {
  showOptionalPhoneWarning?: boolean;
  showEmail?: boolean;
  showVerificationStatus?: boolean;
  labels?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
  };
  placeholders?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
  };
}

export function BasicDataSection({
  labels = {},
  placeholders = {},
  showOptionalPhoneWarning,
  showEmail = true,
  showVerificationStatus = false,
}: BasicDataSectionProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BasicFormData>();
  const defaultLabels = {
    fullName: 'Полное имя *',
    email: 'Email *',
    phoneNumber: 'Телефон',
    ...labels,
  };

  const defaultPlaceholders = {
    fullName: 'Введите полное имя',
    email: 'example@email.com',
    phoneNumber: '+996 555 123 456',
    ...placeholders,
  };

  const phoneNumberValue = watch('phoneNumber');

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='fullName'>{defaultLabels.fullName}</Label>
          <Input
            id='fullName'
            {...register('fullName')}
            placeholder={defaultPlaceholders.fullName}
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              errors.fullName ? 'border-red-500' : ''
            }`}
          />
          {errors.fullName && (
            <p className='text-sm text-red-500'>
              {typeof errors.fullName.message === 'string'
                ? errors.fullName.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        {showEmail && (
          <div className='space-y-2'>
            <Label htmlFor='email'>{defaultLabels.email}</Label>
            <Input
              id='email'
              type='email'
              {...register('email')}
              placeholder={defaultPlaceholders.email}
              className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
                errors.email ? 'border-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className='text-sm text-red-500'>
                {typeof errors.email.message === 'string' ? errors.email.message : 'Ошибка валидации'}
              </p>
            )}
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='phoneNumber'>{defaultLabels.phoneNumber}</Label>
          <Input
            id='phoneNumber'
            type='tel'
            {...register('phoneNumber')}
            placeholder={defaultPlaceholders.phoneNumber}
            onKeyDown={(e) => {
                if (e.key === ' ') e.preventDefault();
            }}
            onInput={(e) => {
                const input = e.currentTarget;
                input.value = input.value.replace(/\s/g, '');
            }}
            className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow ${
              errors.phoneNumber
                ? 'border-red-500'
                : !phoneNumberValue && showOptionalPhoneWarning
                  ? 'border-yellow-400'
                  : ''
            }`}
          />
          {errors.phoneNumber && (
            <p className='text-sm text-red-500'>
              {typeof errors.phoneNumber.message === 'string'
                ? errors.phoneNumber.message
                : 'Ошибка валидации'}
            </p>
          )}
        </div>

        {showVerificationStatus && (
          <div className='space-y-2'>
            <Label htmlFor='verificationStatus'>Статус верификации</Label>
            <Select
              value={watch('verificationStatus') || VerificationStatus.Pending}
              onValueChange={(v) => setValue('verificationStatus', v)}
            >
              <SelectTrigger className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md focus-visible:shadow-md transition-shadow [&>span]:flex-1 [&>span]:text-left'>
                <SelectValue placeholder='Выберите статус' />
              </SelectTrigger>
              <SelectContent>
                {Object.values(VerificationStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {VERIFICATION_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
