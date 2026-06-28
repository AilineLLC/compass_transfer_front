'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import { locationTypeHelpers } from '../helpers/location-type-helpers';
import type { LocationCreateFormData } from '../schemas/locationCreateSchema';
import { LocationType } from '../enums';
import { KYRGYZSTAN_REGIONS } from '@shared/constants/kyrgyzstan-regions';

interface LocationBasicSectionProps {
  labels?: {
    name?: string;
    type?: string;
    city?: string;
    region?: string;
    group?: string;
  };
}

export function LocationBasicSection({
  labels = {},
}: LocationBasicSectionProps) {
  const {
    register,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<LocationCreateFormData>();

  const formData = watch();

  // Zod v4 treats null/undefined as "Invalid option" for z.enum().
  // getSafeValue masks the invalid form value in the Select display, so we must
  // also write the safe fallback back into the form whenever the stored value is invalid.
  // clearErrors removes any stale type error that persisted because shouldValidate:false
  // in setValue does not clear pre-existing errors.
  useEffect(() => {
    const rawType = formData.type as string;
    if (!rawType || !locationTypeHelpers.isValid(rawType)) {
      setValue('type', locationTypeHelpers.getDefault(), { shouldDirty: false, shouldValidate: false });
    }
    clearErrors('type');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type]);

  return (
    <div className="space-y-6">
      {/* Название локации */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          {labels.name || 'Название локации *'}
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Введите название локации"
          className="w-full"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Название автоматически заполняется при выборе адреса на карте, но вы можете его изменить
        </p>
      </div>

      {/* Тип локации */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {labels.type || 'Тип локации *'}
        </Label>
        <Select
          value={locationTypeHelpers.getSafeValue(formData.type)}
          onValueChange={(value: string) => {
            setValue('type', value as LocationType, { shouldValidate: true, shouldDirty: true });
          }}
        >
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder="Выберите тип локации" />
          </SelectTrigger>
          <SelectContent>
            {locationTypeHelpers.getOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Город и Регион */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {labels.city || 'Город'}
          </Label>
          <Select
            value={formData.city || ''}
            onValueChange={(value: string) => {
              setValue('city', value, { shouldValidate: true, shouldDirty: true });
            }}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Выберите город" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(KYRGYZSTAN_REGIONS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="region" className="text-sm font-medium">
            {labels.region || 'Регион / Район'}
          </Label>
          <Input
            id="region"
            {...register('region')}
            placeholder="Например: Ленинский район"
            className="w-full"
          />
          {errors.region && (
            <p className="text-sm text-red-600">{errors.region.message}</p>
          )}
        </div>
      </div>

    </div>
  );
}
