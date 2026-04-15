'use client';

import { useRef, useState } from 'react';
import { Plus, X, ImageIcon, Upload } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Label } from '@shared/ui/forms/label';
import { Input } from '@shared/ui/forms/input';
import { validateImageFile } from '@shared/api/files';
import type { PoiItemDTO } from '../interface/LocationDTO';

export type PoiImageState =
  | { kind: 'empty' }
  | { kind: 'existing'; id: string; path: string }
  | { kind: 'pending'; file: File; previewUrl: string; error?: string };

export type PoiItemState = {
  name: string;
  imageState: PoiImageState;
};

interface LocationPoiSectionProps {
  existingPoi?: PoiItemDTO[];
  onItemsChange?: (items: PoiItemState[]) => void;
}

const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS_URL;

function getImageSrc(state: PoiImageState): string | null {
  if (state.kind === 'existing') return `${UPLOADS_URL}/Uploads/${state.path}`;
  if (state.kind === 'pending' && !state.error) return state.previewUrl;
  return null;
}

export function LocationPoiSection({
  existingPoi = [],
  onItemsChange,
}: LocationPoiSectionProps) {
  const [items, setItems] = useState<PoiItemState[]>(
    existingPoi.map(p => ({
      name: p.name,
      imageState: p.image
        ? { kind: 'existing' as const, id: p.image.id, path: p.image.path }
        : { kind: 'empty' as const },
    })),
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const notify = (next: PoiItemState[]) => {
    setItems(next);
    onItemsChange?.(next);
  };

  const addItem = () => {
    notify([...items, { name: '', imageState: { kind: 'empty' } }]);
  };

  const removeItem = (index: number) => {
    notify(items.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    notify(items.map((item, i) => (i === index ? { ...item, name } : item)));
  };

  const handleImageFile = async (index: number, file: File) => {
    const error = validateImageFile(file) ?? undefined;
    const previewUrl = await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    notify(items.map((item, i) =>
      i === index ? { ...item, imageState: { kind: 'pending' as const, file, previewUrl, error } } : item,
    ));
    if (inputRefs.current[index]) inputRefs.current[index]!.value = '';
  };

  const removeImage = (index: number) => {
    notify(items.map((item, i) =>
      i === index ? { ...item, imageState: { kind: 'empty' as const } } : item,
    ));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Интересные места</Label>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const src = getImageSrc(item.imageState);
            const hasError = item.imageState.kind === 'pending' && item.imageState.error;

            return (
              <div key={index} className="flex items-center gap-2 p-2 rounded-md border bg-white">
                {/* Картинка */}
                <div
                  className={`relative w-10 h-10 flex-shrink-0 rounded border overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity ${
                    hasError ? 'border-red-300 bg-red-50' : 'bg-gray-100'
                  }`}
                  onClick={() => inputRefs.current[index]?.click()}
                  title="Нажмите для загрузки"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={item.name || `${index + 1}`} className="w-full h-full object-cover" />
                  ) : hasError ? (
                    <ImageIcon className="h-4 w-4 text-red-400" />
                  ) : (
                    <Upload className="h-4 w-4 text-gray-400" />
                  )}
                  {item.imageState.kind !== 'empty' && (
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                      onClick={e => { e.stopPropagation(); removeImage(index); }}
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
                <input
                  ref={el => { inputRefs.current[index] = el; }}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(index, file);
                  }}
                />

                {/* Название */}
                <Input
                  value={item.name}
                  onChange={e => updateName(index, e.target.value)}
                  placeholder="Название места"
                  className="h-8 text-sm flex-1"
                />

                {/* Удалить */}
                <button
                  type="button"
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => removeItem(index)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="h-7 text-xs gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Добавить место
      </Button>
    </div>
  );
}
