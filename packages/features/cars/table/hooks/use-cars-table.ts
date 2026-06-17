'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner'
import { carsApi, type CarFilters } from '@shared/api/cars';
import { useSavedFilters } from '@shared/hooks';
import {
  type CarColor,
  type VehicleType,
  type ServiceClass,
  VehicleStatus,
  type CarFeature,
} from '@entities/cars/enums';
import type { GetCarDTO } from '@entities/cars/interface';

interface ColumnVisibility {
  make: boolean;
  model: boolean;
  year: boolean;
  color: boolean;
  licensePlate: boolean;
  type: boolean;
  serviceClass: boolean;
  status: boolean;
  passengerCapacity: boolean;
  features: boolean;
  drivers: boolean;
}

interface SavedCarsFilters extends Record<string, unknown> {
  makeFilter: string;
  modelFilter: string;
  yearFilter: string;
  colorFilter: CarColor[];
  licensePlateFilter: string;
  typeFilter: VehicleType[];
  serviceClassFilter: ServiceClass[];
  statusFilter: VehicleStatus[];
  passengerCapacityFilter: string;
  featuresFilter: CarFeature[];
}

export function useCarsTable(initialFilters?: {
  make?: string;
  model?: string;
  status?: string;
  type?: string;
  serviceClass?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Флаг для отслеживания инициализации
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounce refs для текстовых фильтров
  const makeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yearDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Данные
  const [cars, setCars] = useState<GetCarDTO[]>([]);
  const [filteredCars, setFilteredCars] = useState<GetCarDTO[]>([]);
  const [paginatedCars, setPaginatedCars] = useState<GetCarDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры (инициализация из URL если присутствует)
  const [searchTerm, setSearchTerm] = useState('');
  const [makeFilter, setMakeFilter] = useState(() => searchParams.get('make') || '');
  const [modelFilter, setModelFilter] = useState(() => searchParams.get('model') || '');
  const [yearFilter, setYearFilter] = useState(() => searchParams.get('year') || '');
  const [colorFilter, setColorFilter] = useState<CarColor[]>([]);
  const [licensePlateFilter, setLicensePlateFilter] = useState(() => searchParams.get('licensePlate') || '');
  const [typeFilter, setTypeFilter] = useState<VehicleType[]>(() => {
    const tp = searchParams.get('type');
    return tp ? (tp.split(',') as VehicleType[]) : [];
  });
  const [serviceClassFilter, setServiceClassFilter] = useState<ServiceClass[]>(() => {
    const sc = searchParams.get('serviceClass');
    return sc ? (sc.split(',') as ServiceClass[]) : [];
  });
  const [statusFilter, setStatusFilter] = useState<VehicleStatus[]>(() => {
    const statusParam = searchParams.get('status') || initialFilters?.status;

    if (statusParam && Object.values(VehicleStatus).includes(statusParam as VehicleStatus)) {
      return [statusParam as VehicleStatus];
    }

    return [];
  });
  const [passengerCapacityFilter, setPassengerCapacityFilter] = useState('');
  const [featuresFilter, setFeaturesFilter] = useState<CarFeature[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Пагинация (cursor-based с историей)
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [cursorsHistory, setCursorsHistory] = useState<(string | null)[]>([]);

  // Инициализируем pageSize из localStorage синхронно
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPageSize = localStorage.getItem('cars-page-size');

      if (savedPageSize) {
        const parsedSize = parseInt(savedPageSize, 10);

        if (!isNaN(parsedSize) && parsedSize > 0) {
          return parsedSize;
        }
      }
    }

    return 10; // значение по умолчанию
  });

  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Сортировка
  const [sortBy, setSortBy] = useState<string>('make');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Инициализируем columnVisibility из localStorage синхронно
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cars-column-visibility');

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          toast.error('Ошибка при загрузке сохраненных настроек')
        }
      }
    }

    // Значения по умолчанию
    return {
      make: true,
      model: true,
      year: true,
      color: true,
      licensePlate: true,
      type: true,
      serviceClass: true,
      status: true,
      passengerCapacity: true,
      features: false,
      drivers: true,
    };
  });

  // Дефолтные фильтры (мемоизируем чтобы избежать пересоздания)
  const defaultFilters = useMemo<SavedCarsFilters>(() => ({
    makeFilter: '',
    modelFilter: '',
    yearFilter: '',
    colorFilter: [],
    licensePlateFilter: '',
    typeFilter: [],
    serviceClassFilter: [],
    statusFilter: [],
    passengerCapacityFilter: '',
    featuresFilter: [],
  }), []);

  // Текущие фильтры
  const currentFilters: SavedCarsFilters = {
    makeFilter,
    modelFilter,
    yearFilter,
    colorFilter,
    licensePlateFilter,
    typeFilter,
    serviceClassFilter,
    statusFilter,
    passengerCapacityFilter,
    featuresFilter,
  };

  // Стабильная функция загрузки фильтров (URL params имеют приоритет)
  const onFiltersLoad = useCallback((filters: SavedCarsFilters) => {
    setMakeFilter(searchParams.get('make') ?? filters.makeFilter ?? '');
    setModelFilter(searchParams.get('model') ?? filters.modelFilter ?? '');
    setYearFilter(searchParams.get('year') ?? filters.yearFilter ?? '');
    setColorFilter(filters.colorFilter || []);
    setLicensePlateFilter(searchParams.get('licensePlate') ?? filters.licensePlateFilter ?? '');
    const typeParam = searchParams.get('type');
    setTypeFilter(typeParam ? (typeParam.split(',') as VehicleType[]) : (filters.typeFilter || []));
    const scParam = searchParams.get('serviceClass');
    setServiceClassFilter(scParam ? (scParam.split(',') as ServiceClass[]) : (filters.serviceClassFilter || []));
    const statusParam = searchParams.get('status');
    setStatusFilter(
      statusParam && Object.values(VehicleStatus).includes(statusParam as VehicleStatus)
        ? [statusParam as VehicleStatus]
        : (filters.statusFilter || []),
    );
    setPassengerCapacityFilter(filters.passengerCapacityFilter || '');
    setFeaturesFilter(filters.featuresFilter || []);
    setIsInitialized(true);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Хук для сохранения фильтров
  const { saveFilters, clearSavedFilters, hasSaved, justSaved } = useSavedFilters({
    key: 'cars-filters',
    defaultFilters,
    currentFilters,
    onFiltersLoad,
  });

  // Инициализация, если нет сохраненных фильтров
  useEffect(() => {
    if (!hasSaved && !isInitialized) {
      setIsInitialized(true);
    }
  }, [hasSaved, isInitialized]);

  // Защита от двойных вызовов
  const loadingRef = useRef(false);

  // Загрузка данных
  const loadCars = useCallback(async () => {
    // Предотвращаем двойные вызовы
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const params: CarFilters = {
        first: isFirstPage,
        after: currentCursor || undefined,
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
      };

      // Добавляем фильтры если они заданы
      if (makeFilter) {
        params.make = makeFilter;
        params.makeOp = 'Contains';
      }
      if (modelFilter) {
        params.model = modelFilter;
        params.modelOp = 'Contains';
      }
      if (yearFilter) {
        params.year = parseInt(yearFilter, 10);
        params.yearOp = 'Equal';
      }
      if (colorFilter.length > 0) {
        params.color = colorFilter;
      }
      if (licensePlateFilter) {
        params.licensePlate = licensePlateFilter;
        params.licensePlateOp = 'Contains';
      }
      if (typeFilter.length > 0) {
        params.type = typeFilter;
      }
      if (serviceClassFilter.length > 0) {
        params.serviceClass = serviceClassFilter;
      }
      if (statusFilter.length > 0) {
        params.status = statusFilter;
      }
      if (passengerCapacityFilter) {
        params.passengerCapacity = parseInt(passengerCapacityFilter, 10);
        params.passengerCapacityOp = 'Equal';
      }
      if (featuresFilter.length > 0) {
        params.features = featuresFilter;
      }
      if (searchTerm) {
        params['FTS.Plain'] = searchTerm;
      }

      const response = await carsApi.getCars(params);

      setCars(response.data);
      setFilteredCars(response.data);
      setPaginatedCars(response.data);
      setTotalCount(response.totalCount);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [
    currentCursor,
    isFirstPage,
    pageSize,
    sortBy,
    sortOrder,
    makeFilter,
    modelFilter,
    yearFilter,
    colorFilter,
    licensePlateFilter,
    typeFilter,
    serviceClassFilter,
    statusFilter,
    passengerCapacityFilter,
    featuresFilter,
    searchTerm,
  ]);

  // Загружаем данные при изменении зависимостей (только после инициализации)
  useEffect(() => {
    if (isInitialized) {
      loadCars();
    }
  }, [
    isInitialized,
    currentCursor,
    isFirstPage,
    pageSize,
    sortBy,
    sortOrder,
    makeFilter,
    modelFilter,
    yearFilter,
    colorFilter,
    licensePlateFilter,
    typeFilter,
    serviceClassFilter,
    statusFilter,
    passengerCapacityFilter,
    featuresFilter,
    searchTerm,
    loadCars,
  ]);

  // Синхронизируем все URL-фильтры при внешнем изменении (кнопка назад/вперёд)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const newStatus: VehicleStatus[] = statusParam && Object.values(VehicleStatus).includes(statusParam as VehicleStatus)
      ? [statusParam as VehicleStatus]
      : [];
    if (JSON.stringify(newStatus) !== JSON.stringify(statusFilter)) setStatusFilter(newStatus);

    const typeParam = searchParams.get('type');
    const newType = typeParam ? (typeParam.split(',') as VehicleType[]) : [];
    if (JSON.stringify(newType) !== JSON.stringify(typeFilter)) setTypeFilter(newType);

    const scParam = searchParams.get('serviceClass');
    const newSc = scParam ? (scParam.split(',') as ServiceClass[]) : [];
    if (JSON.stringify(newSc) !== JSON.stringify(serviceClassFilter)) setServiceClassFilter(newSc);

    const makeParam = searchParams.get('make') || '';
    if (makeParam !== makeFilter) setMakeFilter(makeParam);

    const modelParam = searchParams.get('model') || '';
    if (modelParam !== modelFilter) setModelFilter(modelParam);

    const yearParam = searchParams.get('year') || '';
    if (yearParam !== yearFilter) setYearFilter(yearParam);

    const plateParam = searchParams.get('licensePlate') || '';
    if (plateParam !== licensePlateFilter) setLicensePlateFilter(plateParam);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Обработчики
  const handleNextPage = () => {
    if (cars.length > 0) {
      // Используем ID последнего элемента как курсор
      const lastCar = cars[cars.length - 1];

      // Сохраняем текущий cursor в историю
      setCursorsHistory(prev => [...prev, currentCursor]);
      setCurrentCursor(lastCar.id);
      setIsFirstPage(false);
      setCurrentPageNumber(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (cursorsHistory.length > 0) {
      // Берем предыдущий cursor из истории
      const newHistory = [...cursorsHistory];
      const prevCursor = newHistory.pop();

      setCursorsHistory(newHistory);
      setCurrentCursor(prevCursor || null);
      setIsFirstPage(prevCursor === null);
      setCurrentPageNumber(prev => prev - 1);
    }
  };

  const handleFirstPage = () => {
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const handlePageChange = (targetPage: number) => {
    if (targetPage === 1) {
      handleFirstPage();
    } else if (targetPage > currentPageNumber) {
      // Переход вперед - используем handleNextPage несколько раз
      const pagesToAdvance = targetPage - currentPageNumber;

      for (let i = 0; i < pagesToAdvance; i++) {
        handleNextPage();
      }
    } else if (targetPage < currentPageNumber) {
      // Переход назад - используем handlePrevPage несколько раз
      const pagesToGoBack = currentPageNumber - targetPage;

      for (let i = 0; i < pagesToGoBack; i++) {
        handlePrevPage();
      }
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    // Сбрасываем на первую страницу
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cars-page-size', size.toString());
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleColumnVisibilityChange = (column: keyof ColumnVisibility, visible: boolean) => {
    const newVisibility = {
      ...columnVisibility,
      [column]: visible,
    };

    setColumnVisibility(newVisibility);

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cars-column-visibility', JSON.stringify(newVisibility));
    }
  };

  const handleColorFilterChange = (colors: CarColor[]) => {
    setColorFilter(colors);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const handleTypeFilterChange = (types: VehicleType[]) => {
    setTypeFilter(types);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);

    const params = new URLSearchParams(searchParams.toString());
    if (types.length > 0) params.set('type', types.join(',')); else params.delete('type');
    router.push(params.toString() ? `/cars?${params.toString()}` : '/cars');
  };

  const handleServiceClassFilterChange = (classes: ServiceClass[]) => {
    setServiceClassFilter(classes);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);

    const params = new URLSearchParams(searchParams.toString());
    if (classes.length > 0) params.set('serviceClass', classes.join(',')); else params.delete('serviceClass');
    router.push(params.toString() ? `/cars?${params.toString()}` : '/cars');
  };

  const handleStatusFilterChange = useCallback((statuses: VehicleStatus[]) => {
    setStatusFilter(statuses);

    // Обновляем URL
    const params = new URLSearchParams(searchParams.toString());

    if (statuses.length === 1) {
      params.set('status', statuses[0]);
    } else {
      params.delete('status');
    }

    const newURL = params.toString() ? `/cars?${params.toString()}` : '/cars';
    
    router.push(newURL);

    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  }, [searchParams, router]);

  const handleFeaturesFilterChange = (features: CarFeature[]) => {
    setFeaturesFilter(features);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  return {
    // Данные
    cars,
    filteredCars,
    paginatedCars,
    loading,
    error,

    // Фильтры
    searchTerm,
    makeFilter,
    modelFilter,
    yearFilter,
    colorFilter,
    licensePlateFilter,
    typeFilter,
    serviceClassFilter,
    statusFilter,
    passengerCapacityFilter,
    featuresFilter,
    showAdvancedFilters,

    // Пагинация
    currentCursor,
    isFirstPage,
    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,

    // Сортировка
    sortBy,
    sortOrder,

    // Видимость колонок
    columnVisibility,

    // Сеттеры
    setSearchTerm: (term: string) => {
      setSearchTerm(term);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setMakeFilter: (make: string) => {
      setMakeFilter(make);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (makeDebounceRef.current) clearTimeout(makeDebounceRef.current);
      makeDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (make) params.set('make', make); else params.delete('make');
        router.replace(params.toString() ? `/cars?${params.toString()}` : '/cars');
      }, 500);
    },
    setModelFilter: (model: string) => {
      setModelFilter(model);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (modelDebounceRef.current) clearTimeout(modelDebounceRef.current);
      modelDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (model) params.set('model', model); else params.delete('model');
        router.replace(params.toString() ? `/cars?${params.toString()}` : '/cars');
      }, 500);
    },
    setYearFilter: (year: string) => {
      setYearFilter(year);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (yearDebounceRef.current) clearTimeout(yearDebounceRef.current);
      yearDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (year) params.set('year', year); else params.delete('year');
        router.replace(params.toString() ? `/cars?${params.toString()}` : '/cars');
      }, 500);
    },
    setLicensePlateFilter: (plate: string) => {
      setLicensePlateFilter(plate);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current);
      plateDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (plate) params.set('licensePlate', plate); else params.delete('licensePlate');
        router.replace(params.toString() ? `/cars?${params.toString()}` : '/cars');
      }, 500);
    },
    setPassengerCapacityFilter: (capacity: string) => {
      setPassengerCapacityFilter(capacity);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setShowAdvancedFilters,

    // Обработчики
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleColumnVisibilityChange,
    handleColorFilterChange,
    handleTypeFilterChange,
    handleServiceClassFilterChange,
    handleStatusFilterChange,
    handleFeaturesFilterChange,
    loadCars,
    router,

    // Сохранение фильтров
    saveFilters,
    clearSavedFilters,
    hasSavedFilters: hasSaved,
    justSavedFilters: justSaved,
  };
}
