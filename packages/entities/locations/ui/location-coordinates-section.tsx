'use client';

import dynamic from 'next/dynamic';
import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import type { LocationCreateFormData } from '../schemas/locationCreateSchema';

const AreaDrawingMap = dynamic(
  () => import('@shared/ui/maps/area-drawing-map').then(m => m.AreaDrawingMap),
  { ssr: false, loading: () => <div className='h-[400px] bg-gray-100 rounded-lg animate-pulse' /> },
);

interface LocationCoordinatesSectionProps {
  labels?: {
    isActive?: string;
    popular?: string;
  };
}

export function LocationCoordinatesSection({
  labels = {},
}: LocationCoordinatesSectionProps) {
  const {
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<LocationCreateFormData>();

  const isActive = watch('isActive');
  const popular = watch('popular');
  const isLandingOnly = watch('isLandingOnly');
  const isLandingPagePinned = watch('isLandingPagePinned');
  const priceCoefficient = watch('priceCoefficient');
  const polyPriceCoefficient = watch('polyPriceCoefficient') as number[] | null | undefined;
  const latitude = watch('latitude') as number | undefined;
  const longitude = watch('longitude') as number | undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Настройки локации</h3>

        {/* Активность */}
        <div className="flex flex-row items-center space-x-3 rounded-lg border p-4">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => setValue('isActive', checked)}
          />
          <div className="flex-1 space-y-0.5">
            <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              {labels.isActive || 'Активная локация'}
            </Label>
            <div className="text-sm text-muted-foreground">
              Локация доступна для использования в системе
            </div>
            {errors.isActive && (
              <p className="text-sm text-red-600">{errors.isActive.message}</p>
            )}
          </div>
        </div>

        {/* Топ точки */}
        <div className="flex flex-row items-center space-x-3 rounded-lg border p-4">
          <Checkbox
            id="popular"
            checked={popular}
            onCheckedChange={(checked) => setValue('popular', checked)}
          />
          <div className="flex-1 space-y-0.5">
            <Label htmlFor="popular" className="text-sm font-medium cursor-pointer">
              {labels.popular || 'Локация которая показывается в терминале в начале (Топ точки)'}
            </Label>
            <div className="text-sm text-muted-foreground">
              Локация отображается в списке топ точек в терминале
            </div>
            {errors.popular && (
              <p className="text-sm text-red-600">{errors.popular.message}</p>
            )}
          </div>
        </div>

        {/* Лендинг */}
        <div className="flex flex-row items-center space-x-3 rounded-lg border p-4 border-blue-200 bg-blue-50/50">
          <Checkbox
            id="isLandingOnly"
            checked={isLandingOnly ?? false}
            onCheckedChange={(checked) => setValue('isLandingOnly', checked === true ? true : false)}
          />
          <div className="flex-1 space-y-0.5">
            <Label htmlFor="isLandingOnly" className="text-sm font-medium cursor-pointer">
              Показывать на лендинг-сайте
            </Label>
            <div className="text-sm text-muted-foreground">
              Если включено — локация будет отображаться на публичном лендинг-сайте как доступное
              направление для трансферов. Используйте только для конечных точек маршрутов,
              которые должны быть видны клиентам при онлайн-бронировании.
            </div>
            {errors.isLandingOnly && (
              <p className="text-sm text-red-600">{errors.isLandingOnly.message}</p>
            )}
          </div>
        </div>

        {/* Закреплена на лендинге */}
        <div className="flex flex-row items-center space-x-3 rounded-lg border p-4 border-amber-200 bg-amber-50/50">
          <Checkbox
            id="isLandingPagePinned"
            checked={isLandingPagePinned ?? false}
            onCheckedChange={(checked) => setValue('isLandingPagePinned', checked === true)}
          />
          <div className="flex-1 space-y-0.5">
            <Label htmlFor="isLandingPagePinned" className="text-sm font-medium cursor-pointer">
              Закрепить в начале списка на лендинге
            </Label>
            <div className="text-sm text-muted-foreground">
              Если включено — локация будет отображаться первой (закреплённой) в списке направлений
              на лендинг-сайте, независимо от сортировки. Используйте для приоритетных направлений,
              которые должны сразу бросаться в глаза клиенту.
            </div>
            {errors.isLandingPagePinned && (
              <p className="text-sm text-red-600">{errors.isLandingPagePinned.message}</p>
            )}
          </div>
        </div>

        {/* Коэффициент стоимости */}
        <div className="rounded-lg border p-4 space-y-2">
          <Label htmlFor="priceCoefficient" className="text-sm font-medium">
            Коэффициент стоимости поездки
          </Label>
          <Input
            id="priceCoefficient"
            type="number"
            step="0.01"
            min="0"
            placeholder="Например: 1.5"
            value={priceCoefficient ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setValue('priceCoefficient', val === '' ? null : parseFloat(val), { shouldValidate: true });
            }}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground">
            Множитель цены для поездок в эту точку. Оставьте пустым, если коэффициент не применяется.
            Например: <span className="font-medium">1.5</span> = цена ×1.5
          </div>
          {errors.priceCoefficient && (
            <p className="text-sm text-red-600">{errors.priceCoefficient.message}</p>
          )}
        </div>

        {/* Полигон отключения коэффициента */}
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <Label className="text-sm font-medium">Зона отключения коэффициента</Label>
            <p className="text-sm text-muted-foreground mt-0.5">
              Нарисуйте полигон, внутри которого коэффициент стоимости этой локации <span className="font-medium text-red-600">не применяется</span>.
              Например — зона аэропорта, где трансфер считается по базовой цене без наценки.
              Оставьте пустым, если исключений нет.
            </p>
          </div>

          <AreaDrawingMap
            poly={polyPriceCoefficient ?? []}
            onChange={poly => setValue('polyPriceCoefficient', poly.length ? poly : null)}
            height="400px"
            initialCenter={latitude && longitude ? [latitude, longitude] : undefined}
            locationPoint={latitude && longitude ? [latitude, longitude] : undefined}
          />

          {latitude && longitude && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
              Красная точка — координата локации
            </p>
          )}

          {polyPriceCoefficient && polyPriceCoefficient.length > 0 && polyPriceCoefficient.length < 6 && (
            <p className="text-xs text-amber-600">Нужно минимум 3 точки для замкнутого полигона</p>
          )}
        </div>

      </div>
    </div>
  );
}
