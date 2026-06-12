'use client';

import { useRef, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { X, Upload, ImageIcon } from 'lucide-react';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import { Button } from '@shared/ui/forms/button';
import { validateImageFile } from '@shared/api/files';
import { CarTypeValues, type CarType } from '../enums/CarType.enum';
import { ServiceClassValues, type ServiceClass } from '../enums/ServiceClass.enum';
import type { TariffCreateFormData } from '../schemas/tariffCreateSchema';

export type ExistingTariffIcon = { kind: 'existing'; id: string; path: string };
export type PendingTariffIcon = { kind: 'pending'; file: File; previewUrl: string; error?: string };
export type TariffIconItem = ExistingTariffIcon | PendingTariffIcon;

type ColorMode = 'solid' | 'gradient';

interface GradientPreset {
  label: string;
  angle: number;
  title: string;
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { label: '→', angle: 90, title: 'Слева направо' },
  { label: '↓', angle: 180, title: 'Сверху вниз' },
  { label: '↘', angle: 135, title: 'По диагонали ↘' },
  { label: '↗', angle: 45, title: 'По диагонали ↗' },
];

function tryParseGradient(value: string): { angle: number; color1: string; color2: string } | null {
  const match = value.match(/linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{3,8}),\s*(#[0-9a-fA-F]{3,8})\)/);
  if (!match) return null;
  return { angle: parseInt(match[1]), color1: match[2], color2: match[3] };
}

function buildGradient(angle: number, color1: string, color2: string): string {
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

interface TariffBasicSectionProps {
  showOptionalWarning?: boolean;
  labels?: {
    name?: string;
    serviceClass?: string;
    carType?: string;
  };
  placeholders?: {
    name?: string;
  };
  onIconChange?: (item: TariffIconItem | null) => void;
  initialIconItem?: TariffIconItem | null;
}

export function TariffBasicSection({
  showOptionalWarning: _showOptionalWarning = false,
  labels = {},
  placeholders = {},
  onIconChange,
  initialIconItem,
}: TariffBasicSectionProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<TariffCreateFormData>();

  const serviceClass = watch('serviceClass');
  const carType = watch('carType');
  const isLanding = watch('isLanding');
  const color = watch('color');

  // ── Color state ──────────────────────────────────────────────────────────
  const [colorMode, setColorMode] = useState<ColorMode>('solid');
  const [solidColor, setSolidColor] = useState('#6366f1');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientColor1, setGradientColor1] = useState('#6366f1');
  const [gradientColor2, setGradientColor2] = useState('#8b5cf6');
  const colorInitialized = useRef(false);

  // Initialize color state from form value (needed for edit mode after form.reset)
  useEffect(() => {
    if (color && !colorInitialized.current) {
      colorInitialized.current = true;
      const gradient = tryParseGradient(color);
      if (gradient) {
        setColorMode('gradient');
        setGradientAngle(gradient.angle);
        setGradientColor1(gradient.color1);
        setGradientColor2(gradient.color2);
      } else {
        setColorMode('solid');
        setSolidColor(color);
      }
    } else if (!color) {
      colorInitialized.current = false;
    }
  }, [color]);

  const handleColorModeSwitch = (mode: ColorMode) => {
    setColorMode(mode);
    if (mode === 'solid') {
      setValue('color', solidColor);
    } else {
      setValue('color', buildGradient(gradientAngle, gradientColor1, gradientColor2));
    }
  };

  const handleSolidColorChange = (hex: string) => {
    setSolidColor(hex);
    setValue('color', hex);
  };

  const handleAngleChange = (angle: number) => {
    setGradientAngle(angle);
    setValue('color', buildGradient(angle, gradientColor1, gradientColor2));
  };

  const handleGradientColor1Change = (c: string) => {
    setGradientColor1(c);
    setValue('color', buildGradient(gradientAngle, c, gradientColor2));
  };

  const handleGradientColor2Change = (c: string) => {
    setGradientColor2(c);
    setValue('color', buildGradient(gradientAngle, gradientColor1, c));
  };

  const clearColor = () => {
    setValue('color', null);
    colorInitialized.current = false;
  };

  const gradientPreview = buildGradient(gradientAngle, gradientColor1, gradientColor2);

  // ── Icon state ────────────────────────────────────────────────────────────
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [iconItem, setIconItem] = useState<TariffIconItem | null>(null);

  useEffect(() => {
    if (initialIconItem && iconItem === null) {
      setIconItem(initialIconItem);
      onIconChange?.(initialIconItem);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIconItem]);

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

  const handleIconFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const previewUrl = await readAsDataUrl(file);
    const error = validateImageFile(file) ?? undefined;
    const next: TariffIconItem = { kind: 'pending', file, previewUrl, error };
    setIconItem(next);
    onIconChange?.(next);
    if (iconInputRef.current) iconInputRef.current.value = '';
  };

  const removeIcon = () => {
    setIconItem(null);
    onIconChange?.(null);
  };

  const iconSrc = iconItem
    ? iconItem.kind === 'existing'
      ? `${process.env.NEXT_PUBLIC_UPLOADS_URL}/Uploads/${iconItem.path}`
      : iconItem.previewUrl
    : null;
  const iconHasError = iconItem?.kind === 'pending' && iconItem.error;

  return (
    <div className="space-y-6">
      {/* Название тарифа */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          {labels.name || 'Название тарифа *'}
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder={placeholders.name || 'Введите название тарифа'}
          className="w-full"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Класс обслуживания */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {labels.serviceClass || 'Класс обслуживания *'}
        </Label>
        <Select
          value={serviceClass}
          onValueChange={(value) => setValue('serviceClass', value as ServiceClass)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите класс обслуживания" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(ServiceClassValues).map((serviceClassValue) => (
              <SelectItem key={serviceClassValue} value={serviceClassValue}>
                {ServiceClassValues[serviceClassValue as ServiceClass]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.serviceClass && (
          <p className="text-sm text-red-600">{errors.serviceClass.message}</p>
        )}
      </div>

      {/* Тип автомобиля */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {labels.carType || 'Тип автомобиля *'}
        </Label>
        <Select
          value={carType}
          onValueChange={(value) => setValue('carType', value as CarType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите тип автомобиля" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(CarTypeValues).map((carTypeValue) => (
              <SelectItem key={carTypeValue} value={carTypeValue}>
                {CarTypeValues[carTypeValue as CarType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.carType && (
          <p className="text-sm text-red-600">{errors.carType.message}</p>
        )}
      </div>

      {/* Цвет тарифа */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Цвет тарифа</Label>
          {color && (
            <button
              type="button"
              onClick={clearColor}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Сбросить
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
          {(['solid', 'gradient'] as ColorMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => handleColorModeSwitch(mode)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                colorMode === mode
                  ? 'bg-white shadow-sm font-medium text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'solid' ? 'Сплошной' : 'Градиент'}
            </button>
          ))}
        </div>

        {colorMode === 'solid' ? (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={solidColor}
              onChange={e => handleSolidColorChange(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300 p-0.5 flex-shrink-0"
            />
            <Input
              value={solidColor}
              onChange={e => handleSolidColorChange(e.target.value)}
              placeholder="#6366f1"
              className="flex-1 font-mono"
            />
            <div
              className="w-10 h-10 rounded-md border border-gray-200 flex-shrink-0"
              style={{ background: solidColor }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Direction presets + custom angle */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 whitespace-nowrap">Направление:</span>
              {GRADIENT_PRESETS.map(preset => (
                <button
                  key={preset.angle}
                  type="button"
                  title={preset.title}
                  onClick={() => handleAngleChange(preset.angle)}
                  className={`w-8 h-8 rounded border text-sm font-medium transition-colors ${
                    gradientAngle === preset.angle
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={gradientAngle}
                  onChange={e => handleAngleChange(Math.min(360, Math.max(0, Number(e.target.value))))}
                  className="w-16 text-center font-mono"
                />
                <span className="text-xs text-gray-400">°</span>
              </div>
            </div>

            {/* Color stops + preview */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={gradientColor1}
                onChange={e => handleGradientColor1Change(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300 p-0.5 flex-shrink-0"
                title="Начальный цвет"
              />
              <div
                className="flex-1 h-10 rounded-md border border-gray-200"
                style={{ background: gradientPreview }}
              />
              <input
                type="color"
                value={gradientColor2}
                onChange={e => handleGradientColor2Change(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300 p-0.5 flex-shrink-0"
                title="Конечный цвет"
              />
            </div>

            {/* Hex values */}
            <div className="flex items-center gap-3">
              <Input
                value={gradientColor1}
                onChange={e => handleGradientColor1Change(e.target.value)}
                placeholder="#6366f1"
                className="flex-1 font-mono text-xs"
              />
              <span className="text-xs text-gray-400 flex-shrink-0">→</span>
              <Input
                value={gradientColor2}
                onChange={e => handleGradientColor2Change(e.target.value)}
                placeholder="#8b5cf6"
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {errors.color && (
          <p className="text-sm text-red-600">{errors.color.message}</p>
        )}
      </div>

      {/* Иконка тарифа */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Иконка тарифа</Label>
        <p className="text-xs text-muted-foreground">
          Загрузите иконку тарифа в формате JPG, PNG или WEBP
        </p>

        {iconItem ? (
          <div
            className={`flex items-center gap-3 p-2 rounded-lg border ${
              iconHasError ? 'border-red-300 bg-red-50' : 'bg-white'
            }`}
          >
            <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
              {iconHasError ? (
                <ImageIcon className="h-5 w-5 text-red-400" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconSrc!} alt="Иконка тарифа" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {iconItem.kind === 'pending' ? (
                <>
                  <p className="text-sm truncate">{iconItem.file.name}</p>
                  {iconItem.error && (
                    <p className="text-xs text-red-500 mt-0.5">{iconItem.error}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400 truncate font-mono">{iconItem.id}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => iconInputRef.current?.click()}
                title="Заменить"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={removeIcon}
                title="Удалить"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
            onClick={() => iconInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleIconFile(e.dataTransfer.files); }}
          >
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 text-center">Нажмите или перетащите файл сюда</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, JPEG, PNG, WEBP — до 2 МБ</p>
          </div>
        )}

        <input
          ref={iconInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={e => handleIconFile(e.target.files)}
        />
      </div>

      {/* Лендинг */}
      <div className="flex flex-row items-center space-x-3 rounded-lg border p-4 border-blue-200 bg-blue-50/50">
        <Checkbox
          id="isLanding"
          checked={isLanding ?? false}
          onCheckedChange={(checked) => setValue('isLanding', checked === true ? true : false)}
        />
        <div className="flex-1 space-y-0.5">
          <Label htmlFor="isLanding" className="text-sm font-medium cursor-pointer">
            Показывать на лендинг-сайте
          </Label>
          <div className="text-sm text-muted-foreground">
            Если включено — тариф будет отображаться на публичном лендинг-сайте как доступный
            вариант для онлайн-бронирования трансфера. Используйте только для тарифов,
            которые должны быть видны клиентам при самостоятельном выборе услуги.
          </div>
          {errors.isLanding && (
            <p className="text-sm text-red-600">{errors.isLanding.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
