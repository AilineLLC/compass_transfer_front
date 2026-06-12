'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import { locationTypeHelpers } from '../helpers/location-type-helpers';
import { LocationGroupSelect } from './location-group-select';
import type { LocationCreateFormData } from '../schemas/locationCreateSchema';
import { LocationType } from '../enums';

interface LocationBasicSectionProps {
  labels?: {
    name?: string;
    type?: string;
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
    formState: { errors },
  } = useFormContext<LocationCreateFormData>();

  const formData = watch();

  return (
    <div className="space-y-6">
      {/* Скрытое поле для регистрации в форме */}
      <input type="hidden" {...register('type')} />

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
          <SelectTrigger className="w-full">
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

      {/* Группа локации */}
      <div className="space-y-2">
        <LocationGroupSelect label={labels.group || 'Группа локации'} />
      </div>
    </div>
  );
}
