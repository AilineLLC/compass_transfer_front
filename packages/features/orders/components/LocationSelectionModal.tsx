'use client';

import { Search, MapPin, Filter, X, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui/layout/dialog';
import { LocationType, LocationTypeLabels, locationTypeIcons } from '@entities/locations/enums/LocationType.enum';
import { getCities, getRegionsByCity } from '@entities/locations/helpers';
import type { GetLocationDTO } from '@entities/locations/interface';
import { useLocations } from '@features/locations/hooks/useLocations';
import { locationsApi } from '@shared/api/locations';

interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: GetLocationDTO) => void;
  title: string;
  selectedLocationIds?: string[]; // Уже выбранные локации
  isLandingOnly?: boolean; // Показывать только лендинговые локации
}

interface Filters {
  type?: LocationType;
  city?: string;
  region?: string;
  isActive?: boolean;
}

// Результат поиска через Nominatim API
interface GeocodingResult {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
}

// Структурированный адрес из reverse-геокодинга
interface ReverseGeocodeData {
  fullAddress: string;
  country: string;
  region: string;
  city: string;
  street: string;
}

/**
 * Вычисляет короткое название из полного display_name Nominatim.
 * Разделяет по запятым и удаляет последние 4 части (индекс, область, страна и т.п.)
 */
function computeShortName(displayName: string): string {
  const parts = displayName.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length <= 4) return displayName;
  const short = parts.slice(0, parts.length - 4).join(', ');
  return short || parts[0];
}

export function LocationSelectionModal({
  isOpen,
  onClose,
  onLocationSelect,
  title,
  selectedLocationIds = [],
  isLandingOnly,
}: LocationSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<GetLocationDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geocodingResults, setGeocodingResults] = useState<GeocodingResult[]>([]);
  const [creatingPlaceId, setCreatingPlaceId] = useState<string | null>(null);

  const { searchLocations } = useLocations();

  // Получаем списки городов и регионов
  const cities = getCities();
  const availableRegions = filters.city ? getRegionsByCity(filters.city) : [];

  // Поиск: сначала в базе локаций, параллельно запускаем геокодинг
  useEffect(() => {
    const performSearch = async () => {
      if (!isOpen) return;

      const trimmedQuery = searchQuery.trim();
      setIsSearching(true);

      try {
        const params: Record<string, string | number | boolean | LocationType[]> = {
          First: true,
          Size: 100,
        };

        if (trimmedQuery) {
          params.Name = trimmedQuery;
          params.NameOp = 'Contains';
        }
        if (filters.type) params.Type = [filters.type];
        if (filters.city) { params.City = filters.city; params.CityOp = 'Contains'; }
        if (filters.region) { params.Region = filters.region; params.RegionOp = 'Contains'; }
        if (filters.isActive !== undefined) params.IsActive = filters.isActive;
        if (isLandingOnly) params.IsLandingOnly = true;

        // Запускаем геокодинг параллельно с поиском в базе (только при запросе ≥ 2 символов)
        const geocodingPromise: Promise<GeocodingResult[]> = trimmedQuery.length >= 2
          ? fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/geocoding/search?q=${encodeURIComponent(trimmedQuery)}`)
              .then(r => r.ok ? r.json() : [])
              .catch(() => [])
          : Promise.resolve([]);

        const [dbResults, geoResults] = await Promise.all([
          searchLocations(searchQuery, undefined, params).catch(() => []),
          geocodingPromise,
        ]);

        setSearchResults(dbResults);
        setGeocodingResults(geoResults);
      } catch {
        setSearchResults([]);
        setGeocodingResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Сброс при закрытии
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setFilters({});
      setSearchResults([]);
      setGeocodingResults([]);
      setShowFilters(false);
      setCreatingPlaceId(null);
    }
  }, [isOpen]);

  const handleLocationClick = (location: GetLocationDTO) => {
    onLocationSelect(location);
    onClose();
  };

  /**
   * Обработчик выбора результата из геокодинга.
   * Делает reverse-геокодинг для получения структурированного адреса,
   * создаёт локацию в системе и выбирает её как точку маршрута.
   */
  const handleGeocodingResultSelect = async (result: GeocodingResult) => {
    if (creatingPlaceId) return;
    const placeId = String(result.place_id);
    setCreatingPlaceId(placeId);

    try {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      // Получаем структурированный адрес через reverse-геокодинг
      let addressData: ReverseGeocodeData = {
        fullAddress: result.display_name,
        country: 'Кыргызстан',
        region: '',
        city: '',
        street: '',
      };
      try {
        const reverseResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/geocoding/reverse?lat=${lat}&lon=${lon}`);
        if (reverseResponse.ok) {
          addressData = await reverseResponse.json();
        }
      } catch {
        // Используем fallback из display_name
      }

      const name = computeShortName(result.display_name);

      const newLocation = await locationsApi.createLocation({
        type: LocationType.Other,
        name: name || result.display_name,
        address: result.display_name,
        description: null,
        city: addressData.city || 'Бишкек',
        country: addressData.country || 'Кыргызстан',
        region: addressData.region || addressData.city || 'Чуйская область',
        latitude: lat,
        longitude: lon,
        isActive: true,
        isLandingOnly: isLandingOnly ?? null,
        district: null,
        group: null,
        images: [],
        poi: [],
      });

      onLocationSelect(newLocation as unknown as GetLocationDTO);
      onClose();
    } catch {
      toast.error('Не удалось создать локацию. Попробуйте ещё раз.');
    } finally {
      setCreatingPlaceId(null);
    }
  };

  const clearFilters = () => setFilters({});

  const handleCityChange = (city: string) => {
    setFilters(prev => ({
      ...prev,
      city: city === 'all' ? undefined : city,
      region: undefined
    }));
  };

  const handleRegionChange = (region: string) => {
    setFilters(prev => ({
      ...prev,
      region: region === 'all' ? undefined : region
    }));
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  // Показывать геокодинг только когда нет результатов в базе и запрос достаточно длинный
  const trimmedQuery = searchQuery.trim();
  const showGeocodingSection =
    !isSearching &&
    trimmedQuery.length >= 2 &&
    searchResults.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] w-[90vw] overflow-hidden flex flex-col z-[1000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Поиск */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или адресу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Фильтры
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.values(filters).filter(v => v !== undefined && v !== '').length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Фильтры */}
            {showFilters && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Фильтры</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Очистить
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Тип локации</Label>
                    <Select
                      value={filters.type || 'all'}
                      onValueChange={(value) => setFilters(prev => ({
                        ...prev,
                        type: value === 'all' ? undefined : value as LocationType
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Все типы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        {Object.values(LocationType).map(type => (
                          <SelectItem key={type} value={type}>
                            <span className="flex items-center gap-2">
                              <span>{locationTypeIcons[type]}</span>
                              {LocationTypeLabels[type]}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Город</Label>
                    <Select
                      value={filters.city || 'all'}
                      onValueChange={handleCityChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите город" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все города</SelectItem>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Регион</Label>
                    <Select
                      value={filters.region || 'all'}
                      onValueChange={handleRegionChange}
                      disabled={!filters.city}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          filters.city ? "Выберите регион" : "Сначала выберите город"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все регионы</SelectItem>
                        {availableRegions.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Результаты */}
          <div className="flex-1 overflow-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Поиск локаций...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              /* ── Результаты из базы локаций ── */
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Найдено локаций: {searchResults.length}
                </p>
                {searchResults.map((location) => {
                  const isAlreadySelected = selectedLocationIds.includes(location.id);

                  return (
                    <div
                      key={location.id}
                      className={`border rounded-lg p-3 transition-colors ${
                        isAlreadySelected
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                          : 'cursor-pointer hover:bg-muted/50'
                      }`}
                      onClick={() => !isAlreadySelected && handleLocationClick(location)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            <span>{locationTypeIcons[location.type]}</span>
                            {location.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {location.city}, {location.region}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline">{LocationTypeLabels[location.type]}</Badge>
                        </div>
                      </div>
                      {isAlreadySelected && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          Уже выбрано в маршруте
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : showGeocodingSection ? (
              /* ── Результаты из карты (Nominatim) ── */
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>Локации не найдены в системе. Результаты поиска на карте:</span>
                </div>

                {geocodingResults.length > 0 ? (
                  <div className="space-y-2">
                    {geocodingResults.map((result) => {
                      const placeId = String(result.place_id);
                      const isCreating = creatingPlaceId === placeId;
                      const shortName = computeShortName(result.display_name);

                      return (
                        <div
                          key={placeId}
                          className={`border border-dashed rounded-lg p-3 transition-colors ${
                            isCreating || creatingPlaceId
                              ? 'opacity-60 cursor-not-allowed border-blue-200 bg-blue-50/30'
                              : 'cursor-pointer hover:bg-blue-50/50 border-blue-300 bg-blue-50/20'
                          }`}
                          onClick={() => !isCreating && !creatingPlaceId && handleGeocodingResultSelect(result)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium flex items-center gap-2">
                                {isCreating ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
                                ) : (
                                  <Plus className="h-4 w-4 text-blue-500 shrink-0" />
                                )}
                                <span className="truncate">{shortName || result.display_name}</span>
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {result.display_name}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-blue-600 border-blue-300 shrink-0"
                            >
                              {isCreating ? 'Создание...' : 'Создать'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <div className="text-center">
                      <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Ничего не найдено на карте</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Пустое состояние ── */
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {searchQuery || hasActiveFilters
                      ? 'Локации не найдены'
                      : 'Введите запрос для поиска локаций'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
