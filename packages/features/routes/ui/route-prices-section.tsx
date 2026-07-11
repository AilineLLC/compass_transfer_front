'use client';

import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { tariffsApi } from '@shared/api/tariffs';
import type { GetTariffDTO } from '@shared/api/tariffs';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';

export function RoutePricesSection() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({ control, name: 'prices' });

  const [tariffs, setTariffs] = useState<GetTariffDTO[]>([]);
  const [loadingTariffs, setLoadingTariffs] = useState(false);

  useEffect(() => {
    setLoadingTariffs(true);
    tariffsApi.getTariffs({ archived: false })
      .then(res => setTariffs(res.data))
      .catch(() => {})
      .finally(() => setLoadingTariffs(false));
  }, []);

  const watchedPrices = watch('prices');
  const usedTariffIds = watchedPrices?.map(p => p.tariffId) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>Цены по тарифам</Label>
        {loadingTariffs && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Нет добавленных цен. Нажмите «Добавить тариф» ниже.
        </p>
      )}

      {fields.map((field, index) => {
        const rowTariffId = watchedPrices?.[index]?.tariffId;
        const availableTariffs = tariffs.filter(
          t => !usedTariffIds.includes(t.id) || t.id === rowTariffId,
        );

        return (
          <div key={field.id} className="flex items-start gap-3">
            {/* Выбор тарифа */}
            <div className="flex flex-col gap-1 flex-1">
              {index === 0 && <span className="text-xs text-muted-foreground">Тариф</span>}
              <Controller
                control={control}
                name={`prices.${index}.tariffId`}
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className={`h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                      errors.prices?.[index]?.tariffId ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Выберите тариф</option>
                    {availableTariffs.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.prices?.[index]?.tariffId && (
                <p className="text-xs text-red-500">{errors.prices[index]?.tariffId?.message}</p>
              )}
            </div>

            {/* Цена */}
            <div className="flex flex-col gap-1 w-36">
              {index === 0 && <span className="text-xs text-muted-foreground">Цена (сом)</span>}
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                {...register(`prices.${index}.price`, { valueAsNumber: true })}
                className={`focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md transition-shadow ${
                  errors.prices?.[index]?.price ? 'border-red-500' : ''
                }`}
              />
              {errors.prices?.[index]?.price && (
                <p className="text-xs text-red-500">{errors.prices[index]?.price?.message}</p>
              )}
            </div>

            {/* Удалить */}
            <div className={index === 0 ? 'mt-5' : ''}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ tariffId: '', price: 0 })}
        disabled={loadingTariffs || fields.length >= tariffs.length}
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Добавить тариф
      </Button>
    </div>
  );
}
