'use client';

import { useRef, useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Label } from '@shared/ui/forms/label';
import { validateDocumentFile } from '@shared/api/files';

export type ExistingPartnerDocumentItem = { kind: 'existing'; id: string };
export type PendingPartnerDocumentItem = { kind: 'pending'; file: File; error?: string };
export type PartnerDocumentItem = ExistingPartnerDocumentItem | PendingPartnerDocumentItem;

interface PartnerDocumentsSectionProps {
  existingDocumentIds?: string[];
  onItemsChange?: (items: PartnerDocumentItem[]) => void;
}

export function PartnerDocumentsSection({
  existingDocumentIds = [],
  onItemsChange,
}: PartnerDocumentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<PartnerDocumentItem[]>(
    existingDocumentIds.map(id => ({ kind: 'existing', id })),
  );

  const notify = (next: PartnerDocumentItem[]) => {
    setItems(next);
    onItemsChange?.(next);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newItems: PendingPartnerDocumentItem[] = Array.from(files).map(file => ({
      kind: 'pending' as const,
      file,
      error: validateDocumentFile(file) ?? undefined,
    }));
    notify([...items, ...newItems]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (index: number) => {
    notify(items.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  };

  return (
    <div className='space-y-4'>
      <Label className='text-sm font-medium'>Документы</Label>
      <p className='text-xs text-muted-foreground'>
        Загрузите документы партнёра: договоры, счета-фактуры и другие
      </p>

      <div
        className='flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors'
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload className='h-8 w-8 text-gray-400 mb-2' />
        <p className='text-sm text-gray-600 text-center'>Нажмите или перетащите файлы сюда</p>
        <p className='text-xs text-muted-foreground mt-1'>PDF, DOC, DOCX, JPG, PNG — до 10 МБ каждый</p>
        <input
          ref={inputRef}
          type='file'
          accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
          multiple
          className='hidden'
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className='flex flex-col gap-2'>
          {items.map((item, index) => (
            <div
              key={item.kind === 'existing' ? item.id : `${item.file.name}-${index}`}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.kind === 'pending' && item.error ? 'border-red-300 bg-red-50' : 'bg-white'
              }`}
            >
              <div className='w-10 h-10 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center'>
                <FileText className='h-5 w-5 text-gray-500' />
              </div>

              <div className='flex-1 min-w-0'>
                {item.kind === 'pending' ? (
                  <>
                    <p className='text-sm truncate'>{item.file.name}</p>
                    <p className='text-xs text-muted-foreground'>{formatSize(item.file.size)}</p>
                    {item.error && (
                      <p className='text-xs text-red-500 mt-0.5'>{item.error}</p>
                    )}
                  </>
                ) : (
                  <p className='text-xs text-gray-400 truncate font-mono'>{item.id}</p>
                )}
              </div>

              <Button
                type='button'
                size='icon'
                variant='ghost'
                className='h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0'
                onClick={() => remove(index)}
                title='Удалить'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
