'use client';

import { useMemo } from 'react';

interface DiffEntry {
  key: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: unknown;
  newValue?: unknown;
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return `"${v}"`;
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

function parseDelta(delta: unknown, prefix = ''): DiffEntry[] {
  if (!delta || typeof delta !== 'object' || Array.isArray(delta)) return [];
  const entries: DiffEntry[] = [];
  const d = delta as Record<string, unknown>;

  for (const [key, value] of Object.entries(d)) {
    if (key === '_t') continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      if (value.length === 1) {
        entries.push({ key: fullKey, type: 'added', newValue: value[0] });
      } else if (value.length === 2) {
        entries.push({ key: fullKey, type: 'modified', oldValue: value[0], newValue: value[1] });
      } else if (value.length === 3 && value[2] === 0) {
        entries.push({ key: fullKey, type: 'removed', oldValue: value[0] });
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...parseDelta(value, fullKey));
    }
  }

  return entries;
}

interface JsonDiffViewerProps {
  jsonDiff: unknown;
}

export function JsonDiffViewer({ jsonDiff }: JsonDiffViewerProps) {
  const entries = useMemo(() => {
    if (!jsonDiff) return [];

    if (
      typeof jsonDiff === 'object' &&
      !Array.isArray(jsonDiff) &&
      'before' in (jsonDiff as object) &&
      'after' in (jsonDiff as object)
    ) {
      const { before, after } = jsonDiff as { before: Record<string, unknown>; after: Record<string, unknown> };
      const allKeys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
      const result: DiffEntry[] = [];
      for (const key of allKeys) {
        const bv = before?.[key];
        const av = after?.[key];
        if (JSON.stringify(bv) === JSON.stringify(av)) continue;
        if (bv === undefined) result.push({ key, type: 'added', newValue: av });
        else if (av === undefined) result.push({ key, type: 'removed', oldValue: bv });
        else result.push({ key, type: 'modified', oldValue: bv, newValue: av });
      }
      return result;
    }

    return parseDelta(jsonDiff);
  }, [jsonDiff]);

  if (!jsonDiff) {
    return <p className='text-sm text-muted-foreground italic'>Нет данных об изменениях</p>;
  }

  if (entries.length === 0) {
    return (
      <pre className='text-xs bg-gray-50 rounded p-3 overflow-x-auto max-h-64'>
        {JSON.stringify(jsonDiff, null, 2)}
      </pre>
    );
  }

  return (
    <div className='space-y-1.5 font-mono text-xs max-h-72 overflow-y-auto pr-1'>
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`flex gap-2 rounded px-3 py-1.5 ${
            entry.type === 'added'
              ? 'bg-green-50 border border-green-200'
              : entry.type === 'removed'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <span
            className={`shrink-0 font-bold ${
              entry.type === 'added'
                ? 'text-green-600'
                : entry.type === 'removed'
                ? 'text-red-600'
                : 'text-yellow-600'
            }`}
          >
            {entry.type === 'added' ? '+' : entry.type === 'removed' ? '−' : '~'}
          </span>
          <div className='min-w-0 flex-1 break-all'>
            <span className='font-semibold text-gray-700'>{entry.key}:</span>{' '}
            {entry.type === 'modified' ? (
              <>
                <span className='line-through text-red-500 mr-2'>{renderValue(entry.oldValue)}</span>
                <span className='text-green-600'>{renderValue(entry.newValue)}</span>
              </>
            ) : entry.type === 'added' ? (
              <span className='text-green-700'>{renderValue(entry.newValue)}</span>
            ) : (
              <span className='text-red-700'>{renderValue(entry.oldValue)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
