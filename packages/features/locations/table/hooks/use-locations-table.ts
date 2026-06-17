'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { locationsApi, type LocationFilters } from '@shared/api/locations';
import { useSavedFilters } from '@shared/hooks';
import type { LocationType } from '@entities/locations/enums';
import type { LocationDTO } from '@entities/locations/interface/LocationDTO';

interface ColumnVisibility {
  type: boolean;
  name: boolean;
  address: boolean;
  district: boolean;
  city: boolean;
  country: boolean;
  region: boolean;
  coordinates: boolean;
  isActive: boolean;
  popular1: boolean;
  actions: boolean;
}

interface SavedLocationFilters {
  nameFilter: string;
  addressFilter: string;
  districtFilter: string;
  cityFilter: string;
  countryFilter: string;
  regionFilter: string;
}

export function useLocationsTable(_initialFilters?: {
  type?: string;
  city?: string;
  region?: string;
  isActive?: string;
  popular1?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Данные
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationDTO[]>([]);
  const [paginatedLocations, setPaginatedLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cityFilter, setCityFilter] = useState(() => searchParams.get('city') || '');
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState(() => searchParams.get('region') || '');
  const [typeFilter, setTypeFilter] = useState<LocationType[]>(() => {
    const tp = searchParams.get('type');
    return tp ? (tp.split(',') as LocationType[]) : [];
  });
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(() => {
    const isActiveParam = searchParams.get('isActive');

    if (isActiveParam === 'true') return true;
    if (isActiveParam === 'false') return false;

    return null;
  });
  const [popular1Filter, setPopular1Filter] = useState<boolean | null>(() => {
    const p1 = searchParams.get('popular1');
    if (p1 === 'true') return true;
    if (p1 === 'false') return false;
    return null;
  });
  const [isLandingOnlyFilter, setIsLandingOnlyFilter] = useState<boolean | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Пагинация (cursor-based с историей)
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [currentPageNumber, setCurrentPageNumber] = useState(1); // Отслеживаем номер страницы
  const [cursorsHistory, setCursorsHistory] = useState<(string | null)[]>([]);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locations-page-size');

      if (saved) {
        const parsed = parseInt(saved, 10);

        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }

    return 10;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Сортировка
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Видимость колонок
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locations-column-visibility');

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          toast.error('Ошибка при парсинге сохраненной видимости колонок:');
        }
      }
    }

    return {
      type: true,
      name: true,
      address: true,
      district: false,
      city: true,
      country: false,
      region: true,
      coordinates: false,
      isActive: true,
      popular1: true,
      actions: true,
    };
  });

  // Загрузка данных
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: LocationFilters = {
        first: isFirstPage,
        after: currentCursor || undefined,
        size: pageSize,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'Asc' : 'Desc',
      };

      // Добавляем фильтры если они заданы
      if (nameFilter) {
        params.name = nameFilter;
        params.nameOp = 'Contains';
      }
      if (addressFilter) {
        params.address = addressFilter;
        params.addressOp = 'Contains';
      }
      if (districtFilter) {
        params.district = districtFilter;
        params.districtOp = 'Contains';
      }
      if (cityFilter) {
        params.city = cityFilter;
        params.cityOp = 'Contains';
      }
      if (countryFilter) {
        params.country = countryFilter;
        params.countryOp = 'Contains';
      }
      if (regionFilter) {
        params.region = regionFilter;
        params.regionOp = 'Contains';
      }
      if (typeFilter.length > 0) {
        params.type = typeFilter;
      }
      if (isActiveFilter !== null) {
        params.isActive = isActiveFilter;
      }
      if (popular1Filter !== null) {
        params.popular1 = popular1Filter;
      }
      if (isLandingOnlyFilter !== null) {
        params.isLandingOnly = isLandingOnlyFilter;
      }
      if (searchTerm) {
        params['FTS.Plain'] = searchTerm;
      }

      const response = await locationsApi.getLocations(params);
      
      setLocations(response.data);
      setFilteredLocations(response.data);
      setPaginatedLocations(response.data);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
      setTotalCount(response.totalCount);
      setHasNext(response.hasNext);
      setHasPrevious(response.hasPrevious);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [
    currentCursor,
    isFirstPage,
    pageSize,
    sortBy,
    sortOrder,
    nameFilter,
    addressFilter,
    districtFilter,
    cityFilter,
    countryFilter,
    regionFilter,
    typeFilter,
    isActiveFilter,
    popular1Filter,
    isLandingOnlyFilter,
    searchTerm,
  ]);

  // Загружаем данные при изменении зависимостей
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Синхронизация всех URL-фильтров при внешнем изменении (кнопка назад/вперёд)
  useEffect(() => {
    const isActiveParam = searchParams.get('isActive');
    const newIsActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : null;
    if (newIsActive !== isActiveFilter) {
      setIsActiveFilter(newIsActive);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    }

    const typeParam = searchParams.get('type');
    const newType = typeParam ? (typeParam.split(',') as LocationType[]) : [];
    if (JSON.stringify(newType) !== JSON.stringify(typeFilter)) setTypeFilter(newType);

    const p1Param = searchParams.get('popular1');
    const newP1 = p1Param === 'true' ? true : p1Param === 'false' ? false : null;
    if (newP1 !== popular1Filter) setPopular1Filter(newP1);

    const city = searchParams.get('city') || '';
    if (city !== cityFilter) setCityFilter(city);

    const region = searchParams.get('region') || '';
    if (region !== regionFilter) setRegionFilter(region);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Конфигурация для сохранения фильтров
  const defaultFilters: SavedLocationFilters = {
    nameFilter: '',
    addressFilter: '',
    districtFilter: '',
    cityFilter: '',
    countryFilter: '',
    regionFilter: '',
  };

  const currentFilters: SavedLocationFilters = useMemo(() => ({
    nameFilter,
    addressFilter,
    districtFilter,
    cityFilter,
    countryFilter,
    regionFilter,
  }), [nameFilter, addressFilter, districtFilter, cityFilter, countryFilter, regionFilter]);

  // Функция загрузки сохраненных фильтров
  const onFiltersLoad = useCallback((filters: SavedLocationFilters) => {
    setNameFilter(filters.nameFilter || '');
    setAddressFilter(filters.addressFilter || '');
    setDistrictFilter(filters.districtFilter || '');
    setCityFilter(filters.cityFilter || '');
    setCountryFilter(filters.countryFilter || '');
    setRegionFilter(filters.regionFilter || '');
  }, []);

  // Хук для сохранения фильтров
  const { saveFilters, clearSavedFilters, hasSaved, justSaved } = useSavedFilters({
    key: 'locations-filters',
    defaultFilters: defaultFilters as unknown as Record<string, unknown>,
    currentFilters: currentFilters as unknown as Record<string, unknown>,
    onFiltersLoad: onFiltersLoad as unknown as (filters: Record<string, unknown>) => void,
  });

  // Функция для обработки изменения статуса с обновлением URL
  const handleIsActiveFilterChange = useCallback((isActive: boolean | null) => {
    setIsActiveFilter(isActive);

    // Обновляем URL
    const params = new URLSearchParams(searchParams.toString());

    if (isActive === null) {
      params.delete('isActive');
    } else {
      params.set('isActive', isActive.toString());
    }

    const newURL = params.toString() ? `/locations?${params.toString()}` : '/locations';
    
    router.push(newURL);

    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  }, [searchParams, router]);

  // Обработчики
  const handleNextPage = () => {
    if (locations.length > 0) {
      const lastLocation = locations[locations.length - 1];

      // Сохраняем текущий cursor в историю
      setCursorsHistory(prev => [...prev, currentCursor]);
      setCurrentCursor(lastLocation.id);
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

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locations-page-size', size.toString());
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
    setColumnVisibility(prev => {
      const newVisibility = {
        ...prev,
        [column]: visible,
      };

      // Сохраняем в localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('locations-column-visibility', JSON.stringify(newVisibility));
      }

      return newVisibility;
    });
  };

  const handleTypeFilterChange = (types: LocationType[]) => {
    setTypeFilter(types);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);

    const params = new URLSearchParams(searchParams.toString());
    if (types.length > 0) params.set('type', types.join(',')); else params.delete('type');
    router.push(params.toString() ? `/locations?${params.toString()}` : '/locations');
  };

  return {
    // Данные
    locations,
    filteredLocations,
    paginatedLocations,
    loading,
    error,

    // Фильтры
    searchTerm,
    nameFilter,
    addressFilter,
    districtFilter,
    cityFilter,
    countryFilter,
    regionFilter,
    typeFilter,
    isActiveFilter,
    popular1Filter,
    isLandingOnlyFilter,
    showAdvancedFilters,

    // Пагинация
    currentCursor,
    isFirstPage,
    currentPageNumber,
    pageSize,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,

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
    setNameFilter: (name: string) => {
      setNameFilter(name);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setAddressFilter: (address: string) => {
      setAddressFilter(address);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setDistrictFilter: (district: string) => {
      setDistrictFilter(district);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setCityFilter: (city: string) => {
      setCityFilter(city);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
      cityDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (city) params.set('city', city); else params.delete('city');
        router.replace(params.toString() ? `/locations?${params.toString()}` : '/locations');
      }, 500);
    },
    setCountryFilter: (country: string) => {
      setCountryFilter(country);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setRegionFilter: (region: string) => {
      setRegionFilter(region);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
      regionDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (region) params.set('region', region); else params.delete('region');
        router.replace(params.toString() ? `/locations?${params.toString()}` : '/locations');
      }, 500);
    },
    setIsActiveFilter: (isActive: boolean | null) => {
      setIsActiveFilter(isActive);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setPopular1Filter: (popular1: boolean | null) => {
      setPopular1Filter(popular1);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      const params = new URLSearchParams(searchParams.toString());
      if (popular1 !== null) params.set('popular1', String(popular1)); else params.delete('popular1');
      router.push(params.toString() ? `/locations?${params.toString()}` : '/locations');
    },
    setIsLandingOnlyFilter: (val: boolean | null) => {
      setIsLandingOnlyFilter(val);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setShowAdvancedFilters,

    // Обработчики
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleSort,
    handleColumnVisibilityChange,
    handleTypeFilterChange,
    handleIsActiveFilterChange,
    loadLocations,
    router,

    // Сохранение фильтров
    saveFilters,
    clearSavedFilters,
    hasSavedFilters: hasSaved,
    justSavedFilters: justSaved,
  };
}
