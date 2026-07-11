import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// vi.hoisted ensures these are initialized before the hoisted vi.mock calls
const { mockCreateService, mockUpdateService } = vi.hoisted(() => ({
  mockCreateService: vi.fn(),
  mockUpdateService: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@shared/lib', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@shared/api/services', () => ({
  servicesApi: {
    createService: mockCreateService,
    updateService: mockUpdateService,
  },
}));

import { useServiceFormLogic } from '../create/service-form';
import { useServiceEditFormLogic } from '../edit/service-edit-form';

const makeCallbacks = () => ({ onBack: vi.fn(), onSuccess: vi.fn() });

describe('useServiceFormLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes form with default empty values', () => {
    const { result } = renderHook(() => useServiceFormLogic(makeCallbacks()));
    const values = result.current.form.getValues();
    expect(values.name).toBe('');
    expect(values.description).toBe('');
    expect(values.isQuantifiable).toBe(false);
  });

  it('isSubmitting starts as false', () => {
    const { result } = renderHook(() => useServiceFormLogic(makeCallbacks()));
    expect(result.current.isSubmitting).toBe(false);
  });

  it('onCreate with invalid form does not call createService', async () => {
    const cbs = makeCallbacks();
    const { result } = renderHook(() => useServiceFormLogic(cbs));
    await act(async () => { await result.current.onCreate(); });
    expect(mockCreateService).not.toHaveBeenCalled();
    expect(cbs.onSuccess).not.toHaveBeenCalled();
  });

  it('onCreate with valid form calls createService and then onSuccess', async () => {
    mockCreateService.mockResolvedValue({ name: 'Трансфер' });
    const cbs = makeCallbacks();
    const { result } = renderHook(() => useServiceFormLogic(cbs));

    act(() => {
      result.current.form.setValue('name', 'Трансфер');
      result.current.form.setValue('price', 500);
      result.current.form.setValue('isQuantifiable', false);
    });

    await act(async () => { await result.current.onCreate(); });

    expect(mockCreateService).toHaveBeenCalledWith({
      name: 'Трансфер',
      description: null,
      price: 500,
      isQuantifiable: false,
    });
    expect(cbs.onSuccess).toHaveBeenCalledTimes(1);
  });

  it('getChapterStatus returns pending for empty form', () => {
    const { result } = renderHook(() => useServiceFormLogic(makeCallbacks()));
    expect(result.current.getChapterStatus('basic')).toBe('pending');
  });

  it('getChapterStatus returns warning when name+price filled but no description', () => {
    const { result } = renderHook(() => useServiceFormLogic(makeCallbacks()));
    act(() => {
      result.current.form.setValue('name', 'Трансфер');
      result.current.form.setValue('price', 100);
      result.current.form.setValue('isQuantifiable', false);
    });
    expect(result.current.getChapterStatus('basic')).toBe('warning');
  });

  it('getChapterStatus returns complete when all fields including description are filled', () => {
    const { result } = renderHook(() => useServiceFormLogic(makeCallbacks()));
    act(() => {
      result.current.form.setValue('name', 'Трансфер');
      result.current.form.setValue('price', 100);
      result.current.form.setValue('isQuantifiable', false);
      result.current.form.setValue('description', 'Описание услуги');
    });
    expect(result.current.getChapterStatus('basic')).toBe('complete');
  });

  it('getChapterErrors returns empty array for unknown chapter', () => {
    const { result } = renderHook(() => useServiceFormLogic(makeCallbacks()));
    expect(result.current.getChapterErrors('unknown')).toEqual([]);
  });

  it('onBack calls the provided callback', () => {
    const cbs = makeCallbacks();
    const { result } = renderHook(() => useServiceFormLogic(cbs));
    act(() => { result.current.onBack(); });
    expect(cbs.onBack).toHaveBeenCalledTimes(1);
  });
});

describe('useServiceEditFormLogic', () => {
  const initialData = {
    name: 'Старый трансфер',
    description: 'Описание',
    price: 300,
    isQuantifiable: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes form with provided initialData', () => {
    const { result } = renderHook(() =>
      useServiceEditFormLogic({
        serviceId: 'svc-1',
        initialData,
        ...makeCallbacks(),
      }),
    );
    const values = result.current.form.getValues();
    expect(values.name).toBe('Старый трансфер');
    expect(values.price).toBe(300);
    expect(values.isQuantifiable).toBe(true);
  });

  it('onUpdate with valid form calls updateService with serviceId', async () => {
    mockUpdateService.mockResolvedValue({ name: 'Новый трансфер' });
    const cbs = makeCallbacks();
    const { result } = renderHook(() =>
      useServiceEditFormLogic({ serviceId: 'svc-42', initialData, ...cbs }),
    );

    await act(async () => { await result.current.onUpdate(); });

    expect(mockUpdateService).toHaveBeenCalledWith(
      'svc-42',
      expect.objectContaining({ name: 'Старый трансфер', price: 300 }),
    );
    expect(cbs.onSuccess).toHaveBeenCalledTimes(1);
  });

  it('onUpdate with invalid form does not call updateService', async () => {
    const cbs = makeCallbacks();
    const { result } = renderHook(() =>
      useServiceEditFormLogic({
        serviceId: 'svc-1',
        initialData: { ...initialData, name: '' },
        ...cbs,
      }),
    );

    await act(async () => { await result.current.onUpdate(); });
    expect(mockUpdateService).not.toHaveBeenCalled();
  });
});
