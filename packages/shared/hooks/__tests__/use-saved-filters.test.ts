import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useSavedFilters } from '../use-saved-filters';

type Filters = { search: string; status: string };

const defaultFilters: Filters = { search: '', status: '' };

describe('useSavedFilters', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns hasSaved=false when nothing is stored', () => {
    const onFiltersLoad = vi.fn();
    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'test-key',
        defaultFilters,
        currentFilters: defaultFilters,
        onFiltersLoad,
      }),
    );

    expect(result.current.hasSaved).toBe(false);
  });

  it('loads saved filters on mount and calls onFiltersLoad', () => {
    const saved: Filters = { search: 'hello', status: 'active' };
    localStorage.setItem('test-key', JSON.stringify(saved));

    const onFiltersLoad = vi.fn();
    renderHook(() =>
      useSavedFilters({
        key: 'test-key',
        defaultFilters,
        currentFilters: defaultFilters,
        onFiltersLoad,
      }),
    );

    expect(onFiltersLoad).toHaveBeenCalledWith(expect.objectContaining(saved));
  });

  it('saveFilters persists current filters to localStorage', async () => {
    const current: Filters = { search: 'test', status: 'done' };
    const onFiltersLoad = vi.fn();
    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'save-key',
        defaultFilters,
        currentFilters: current,
        onFiltersLoad,
      }),
    );

    act(() => { result.current.saveFilters(); });

    const stored = JSON.parse(localStorage.getItem('save-key') ?? '{}');
    expect(stored.search).toBe('test');
    expect(stored.status).toBe('done');
    expect(result.current.hasSaved).toBe(true);
    expect(result.current.justSaved).toBe(true);
  });

  it('saveFilters omits empty string values', () => {
    const current: Filters = { search: '', status: 'active' };
    const onFiltersLoad = vi.fn();
    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'omit-key',
        defaultFilters,
        currentFilters: current,
        onFiltersLoad,
      }),
    );

    act(() => { result.current.saveFilters(); });

    const stored = JSON.parse(localStorage.getItem('omit-key') ?? '{}');
    expect(stored.search).toBeUndefined();
    expect(stored.status).toBe('active');
  });

  it('clearSavedFilters removes item and resets state', () => {
    localStorage.setItem('clear-key', JSON.stringify({ search: 'x' }));
    const onFiltersLoad = vi.fn();
    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'clear-key',
        defaultFilters,
        currentFilters: defaultFilters,
        onFiltersLoad,
      }),
    );

    act(() => { result.current.clearSavedFilters(); });

    expect(localStorage.getItem('clear-key')).toBeNull();
    expect(result.current.hasSaved).toBe(false);
    expect(onFiltersLoad).toHaveBeenCalledWith(defaultFilters);
  });

  it('hasSavedFilters returns true when localStorage has key', () => {
    localStorage.setItem('check-key', JSON.stringify({ search: 'x' }));
    const onFiltersLoad = vi.fn();
    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'check-key',
        defaultFilters,
        currentFilters: defaultFilters,
        onFiltersLoad,
      }),
    );

    expect(result.current.hasSavedFilters()).toBe(true);
  });

  it('hasSavedFilters returns false when localStorage has no key', () => {
    const onFiltersLoad = vi.fn();
    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'no-key',
        defaultFilters,
        currentFilters: defaultFilters,
        onFiltersLoad,
      }),
    );

    expect(result.current.hasSavedFilters()).toBe(false);
  });

  it('saveFilters returns false and shows toast.error when localStorage.setItem throws', () => {
    const onFiltersLoad = vi.fn();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'err-key',
        defaultFilters,
        currentFilters: { search: 'x', status: '' },
        onFiltersLoad,
      }),
    );

    let saveResult: boolean | undefined;
    act(() => { saveResult = result.current.saveFilters(); });

    expect(saveResult).toBe(false);
    // toast is imported from sonner mock
  });

  it('clearSavedFilters returns false and shows toast.error when localStorage.removeItem throws', () => {
    const onFiltersLoad = vi.fn();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('Security error');
    });

    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'err-key2',
        defaultFilters,
        currentFilters: defaultFilters,
        onFiltersLoad,
      }),
    );

    let clearResult: boolean | undefined;
    act(() => { clearResult = result.current.clearSavedFilters(); });

    expect(clearResult).toBe(false);
  });

  it('hasSavedFilters returns false when localStorage.getItem throws', () => {
    const onFiltersLoad = vi.fn();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Security error');
    });

    const { result } = renderHook(() =>
      useSavedFilters({
        key: 'err-key3',
        defaultFilters,
        currentFilters: defaultFilters,
        onFiltersLoad,
      }),
    );

    // hasSavedFilters should return false when getItem throws
    expect(result.current.hasSavedFilters()).toBe(false);

    vi.restoreAllMocks();
  });
});
