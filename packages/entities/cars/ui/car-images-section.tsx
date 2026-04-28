'use client';

import { useRef, useState } from 'react';
import { X, Upload, ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Label } from '@shared/ui/forms/label';
import { validateImageFile } from '@shared/api/files';
import type { CarImageDTO } from '@entities/cars/interface/GetCarDTO';

export type ExistingCarImageItem = { kind: 'existing'; id: string; path: string };
export type PendingCarImageItem = { kind: 'pending'; file: File; previewUrl: string; error?: string };
export type CarImagesItem = ExistingCarImageItem | PendingCarImageItem;

interface CarImagesSectionProps {
  existingImages?: CarImageDTO[];
  onItemsChange?: (items: CarImagesItem[]) => void;
}

export function CarImagesSection({
  existingImages = [],
  onItemsChange,
}: CarImagesSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<CarImagesItem[]>(
    existingImages.map(img => ({ kind: 'existing', id: img.id, path: img.path })),
  );

  const notify = (next: CarImagesItem[]) => {
    setItems(next);
    onItemsChange?.(next);
  };

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newItems: PendingCarImageItem[] = await Promise.all(
      Array.from(files).map(async file => ({
        kind: 'pending' as const,
        file,
        previewUrl: await readAsDataUrl(file),
        error: validateImageFile(file) ?? undefined,
      })),
    );
    notify([...items, ...newItems]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (index: number) => {
    notify(items.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    notify(next);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    notify(next);
  };

  const getUploadUrl = (path: string) =>
    `${process.env.NEXT_PUBLIC_UPLOADS_URL}/Uploads/${path}`;

  const getSrc = (item: CarImagesItem) =>
    item.kind === 'existing' ? getUploadUrl(item.path) : item.previewUrl;

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Фотографии автомобиля</Label>
      <p className="text-xs text-muted-foreground">
        Загружайте фотографии автомобиля в формате 1:1 для корректного отображения
      </p>

      <div
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 text-center">Нажмите или перетащите файлы сюда</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, JPEG, PNG, WEBP — до 2 МБ каждый</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div
              key={item.kind === 'existing' ? item.id : item.previewUrl}
              className={`flex items-center gap-3 p-2 rounded-lg border ${
                item.kind === 'pending' && item.error ? 'border-red-300 bg-red-50' : 'bg-white'
              }`}
            >
              <span className="w-6 text-center text-xs font-semibold text-gray-400 flex-shrink-0">
                {index + 1}
              </span>

              <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
                {item.kind === 'pending' && item.error ? (
                  <ImageIcon className="h-6 w-6 text-red-400" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getSrc(item)}
                    alt={`Фото ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {item.kind === 'pending' ? (
                  <>
                    <p className="text-sm truncate">{item.file.name}</p>
                    {item.error && (
                      <p className="text-xs text-red-500 mt-0.5">{item.error}</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 truncate font-mono">{item.id}</p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveUp(index)}
                  title="Переместить вверх"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === items.length - 1}
                  onClick={() => moveDown(index)}
                  title="Переместить вниз"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => remove(index)}
                  title="Удалить"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
