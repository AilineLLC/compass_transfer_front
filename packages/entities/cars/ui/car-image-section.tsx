'use client';

import { useRef, useState } from 'react';
import { X, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Label } from '@shared/ui/forms/label';
import { validateImageFile } from '@shared/api/files';

export type ExistingCarImage = { kind: 'existing'; id: string; path: string };
export type PendingCarImage = { kind: 'pending'; file: File; previewUrl: string; error?: string };
export type CarImageItem = ExistingCarImage | PendingCarImage | null;

interface CarImageSectionProps {
  existingImagePath?: string | null;
  existingImageId?: string | null;
  onImageChange?: (item: CarImageItem) => void;
}

export function CarImageSection({
  existingImagePath,
  existingImageId,
  onImageChange,
}: CarImageSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitialItem = (): CarImageItem => {
    if (existingImageId && existingImagePath) {
      return { kind: 'existing', id: existingImageId, path: existingImagePath };
    }
    return null;
  };

  const [item, setItem] = useState<CarImageItem>(getInitialItem);

  const notify = (next: CarImageItem) => {
    setItem(next);
    onImageChange?.(next);
  };

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const previewUrl = await readAsDataUrl(file);
    const error = validateImageFile(file) ?? undefined;
    notify({ kind: 'pending', file, previewUrl, error });
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = () => notify(null);

  const getUploadUrl = (path: string) =>
    `${process.env.NEXT_PUBLIC_UPLOADS_URL}/Uploads/${path}`;

  const getSrc = () => {
    if (!item) return null;
    return item.kind === 'existing' ? getUploadUrl(item.path) : item.previewUrl;
  };

  const src = getSrc();
  const hasError = item?.kind === 'pending' && item.error;

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Фотография автомобиля</Label>
      <p className="text-xs text-muted-foreground">
        Загружайте фотографию для автомобиля в формате 1:1 для корректного отображения на сайте
      </p>

      {item ? (
        <div
          className={`flex items-center gap-3 p-2 rounded-lg border ${
            hasError ? 'border-red-300 bg-red-50' : 'bg-white'
          }`}
        >
          {/* Превью */}
          <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
            {hasError ? (
              <ImageIcon className="h-6 w-6 text-red-400" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src!}
                alt="Фото автомобиля"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Имя */}
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

          {/* Кнопки */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => inputRef.current?.click()}
              title="Заменить"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={remove}
              title="Удалить"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 text-center">Нажмите или перетащите файл сюда</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, JPEG, PNG, WEBP — до 2 МБ</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={e => handleFile(e.target.files)}
      />
    </div>
  );
}
