'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { X, Plus, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { tagsApi, type TagDTO } from '@shared/api/tags';
import { Label } from '@shared/ui/forms/label';
import { Input } from '@shared/ui/forms/input';
import type { LocationCreateFormData } from '../schemas/locationCreateSchema';

export function LocationTagSelect() {
  const { watch, setValue } = useFormContext<LocationCreateFormData>();
  const selectedIds: string[] = watch('tags') ?? [];

  const [allTags, setAllTags] = useState<TagDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    tagsApi.getTags()
      .then(setAllTags)
      .catch(() => toast.error('Не удалось загрузить теги'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedTags = allTags.filter(t => selectedIds.includes(t.id));
  const trimmed = query.trim();

  const filtered = allTags.filter(
    t =>
      !selectedIds.includes(t.id) &&
      t.name.toLowerCase().includes(trimmed.toLowerCase()),
  );

  const exactMatch = allTags.some(
    t => t.name.toLowerCase() === trimmed.toLowerCase(),
  );

  const select = (id: string) => {
    setValue('tags', [...selectedIds, id]);
    setQuery('');
    setOpen(false);
  };

  const remove = (id: string) => {
    setValue('tags', selectedIds.filter(x => x !== id));
  };

  const handleCreate = async () => {
    if (!trimmed || exactMatch) return;
    setCreating(true);
    try {
      const newTag = await tagsApi.createTag(trimmed);
      setAllTags(prev => [...prev, newTag]);
      setValue('tags', [...selectedIds, newTag.id]);
      setQuery('');
      setOpen(false);
    } catch {
      toast.error('Не удалось создать тег');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) {
        select(filtered[0].id);
      } else if (trimmed && !exactMatch) {
        handleCreate();
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Теги</Label>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-sm text-gray-700"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => remove(tag.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <div className="relative">
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? 'Загрузка...' : 'Поиск или создание тега...'}
            disabled={loading}
            className="pr-8"
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md max-h-52 overflow-auto">
            {filtered.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => select(tag.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
              >
                <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                {tag.name}
              </button>
            ))}

            {trimmed && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 text-indigo-600 border-t"
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
                ) : (
                  <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                Создать тег «{trimmed}»
              </button>
            )}

            {filtered.length === 0 && !trimmed && (
              <div className="px-3 py-2 text-sm text-gray-400">
                Начните вводить название тега
              </div>
            )}

            {filtered.length === 0 && trimmed && exactMatch && (
              <div className="px-3 py-2 text-sm text-gray-400">
                Тег уже добавлен
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
