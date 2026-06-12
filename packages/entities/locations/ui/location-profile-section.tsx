'use client';

import { useRef, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { X, Upload, ImageIcon, UserRound } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { validateImageFile } from '@shared/api/files';
import type { LocationImageDTO, PoiItemDTO } from '../interface/LocationDTO';
import type { ImageItem } from './location-images-section';
import type { PoiItemState } from './location-poi-section';
import { LocationImagesSection } from './location-images-section';
import { LocationPoiSection } from './location-poi-section';
import { LocationTagSelect } from './location-tag-select';
import type { LocationCreateFormData } from '../schemas/locationCreateSchema';

// ── Advice image types ────────────────────────────────────────────────────────
export type AdviceImageExisting = { kind: 'existing'; id: string; path: string };
export type AdviceImagePending = { kind: 'pending'; file: File; previewUrl: string; error?: string };
export type AdviceImageItem = AdviceImageExisting | AdviceImagePending;

interface LocationProfileSectionProps {
  existingImages?: LocationImageDTO[];
  existingPoi?: PoiItemDTO[];
  existingAdviceImage?: { id: string; path: string } | null;
  onImagesChange: (items: ImageItem[]) => void;
  onPoiChange: (items: PoiItemState[]) => void;
  onAdviceImageChange?: (item: AdviceImageItem | null) => void;
}

export function LocationProfileSection({
  existingImages,
  existingPoi,
  existingAdviceImage,
  onImagesChange,
  onPoiChange,
  onAdviceImageChange,
}: LocationProfileSectionProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<LocationCreateFormData>();

  const advice = watch('advice');

  // ── Advice toggle ─────────────────────────────────────────────────────────
  const [adviceEnabled, setAdviceEnabled] = useState(!!advice?.fullName);

  const toggleAdvice = (enabled: boolean) => {
    setAdviceEnabled(enabled);
    if (!enabled) {
      setValue('advice', null);
      setAdviceImageItem(null);
      onAdviceImageChange?.(null);
    } else {
      setValue('advice', { fullName: '', specialization: null, content: '' });
    }
  };

  // ── Advice image ──────────────────────────────────────────────────────────
  const adviceInputRef = useRef<HTMLInputElement>(null);
  const [adviceImageItem, setAdviceImageItem] = useState<AdviceImageItem | null>(null);
  const adviceInitialized = useRef(false);

  useEffect(() => {
    if (existingAdviceImage && !adviceInitialized.current) {
      adviceInitialized.current = true;
      const item: AdviceImageItem = { kind: 'existing', id: existingAdviceImage.id, path: existingAdviceImage.path };
      setAdviceImageItem(item);
      onAdviceImageChange?.(item);
      setAdviceEnabled(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingAdviceImage]);

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

  const handleAdviceImageFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const previewUrl = await readAsDataUrl(file);
    const error = validateImageFile(file) ?? undefined;
    const item: AdviceImageItem = { kind: 'pending', file, previewUrl, error };
    setAdviceImageItem(item);
    onAdviceImageChange?.(item);
    if (adviceInputRef.current) adviceInputRef.current.value = '';
  };

  const removeAdviceImage = () => {
    setAdviceImageItem(null);
    onAdviceImageChange?.(null);
  };

  const adviceImageSrc = adviceImageItem
    ? adviceImageItem.kind === 'existing'
      ? `${process.env.NEXT_PUBLIC_UPLOADS_URL}/Uploads/${adviceImageItem.path}`
      : adviceImageItem.previewUrl
    : null;
  const adviceImageHasError = adviceImageItem?.kind === 'pending' && adviceImageItem.error;


  return (
    <div className="space-y-8">
      {/* Описание */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Описание
        </Label>
        <textarea
          id="description"
          {...register('description')}
          placeholder="Описание локации для лендинга (необязательно)"
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none',
            'focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 no-ring resize-none',
          )}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Теги */}
      <LocationTagSelect />

      {/* Фотографии */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Фотографии</Label>
        <LocationImagesSection
          existingImages={existingImages}
          onItemsChange={onImagesChange}
        />
      </div>

      {/* Интересные места */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Интересные места (POI)</Label>
        <LocationPoiSection
          existingPoi={existingPoi}
          onItemsChange={onPoiChange}
        />
      </div>

      {/* Совет местного */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border p-4 border-green-200 bg-green-50/50">
          <Checkbox
            id="adviceEnabled"
            checked={adviceEnabled}
            onCheckedChange={checked => toggleAdvice(checked === true)}
          />
          <div className="flex-1">
            <Label htmlFor="adviceEnabled" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <UserRound className="h-4 w-4 text-green-600" />
              Совет местного
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Добавьте персональный совет от местного жителя или эксперта
            </p>
          </div>
        </div>

        {adviceEnabled && (
          <div className="rounded-lg border p-4 space-y-4">
            {/* Фото советника */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Фото советника</Label>
              {adviceImageItem ? (
                <div
                  className={`flex items-center gap-3 p-2 rounded-lg border ${
                    adviceImageHasError ? 'border-red-300 bg-red-50' : 'bg-white'
                  }`}
                >
                  <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
                    {adviceImageHasError ? (
                      <ImageIcon className="h-5 w-5 text-red-400" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={adviceImageSrc!} alt="Фото советника" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {adviceImageItem.kind === 'pending' ? (
                      <>
                        <p className="text-sm truncate">{adviceImageItem.file.name}</p>
                        {adviceImageItem.error && (
                          <p className="text-xs text-red-500 mt-0.5">{adviceImageItem.error}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 truncate font-mono">{adviceImageItem.id}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => adviceInputRef.current?.click()} title="Заменить">
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={removeAdviceImage} title="Удалить">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  onClick={() => adviceInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleAdviceImageFile(e.dataTransfer.files); }}
                >
                  <Upload className="h-6 w-6 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500">Нажмите или перетащите фото советника</span>
                </div>
              )}
              <input
                ref={adviceInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={e => handleAdviceImageFile(e.target.files)}
              />
            </div>

            {/* Полное имя */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Полное имя *</Label>
              <Input
                {...register('advice.fullName')}
                placeholder="Имя Фамилия"
              />
              {errors.advice?.fullName && (
                <p className="text-xs text-red-600">{errors.advice.fullName.message}</p>
              )}
            </div>

            {/* Специализация */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Специализация</Label>
              <Input
                {...register('advice.specialization')}
                placeholder="Гид, историк, шеф-повар..."
              />
            </div>

            {/* Текст совета */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Совет *</Label>
              <textarea
                {...register('advice.content')}
                placeholder="Поделитесь советом для путешественников..."
                className={cn(
                  'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none',
                  'focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 no-ring resize-none',
                )}
                rows={4}
              />
              {errors.advice?.content && (
                <p className="text-xs text-red-600">{errors.advice.content.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
