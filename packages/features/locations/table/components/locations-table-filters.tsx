'use client';

import { Search, Filter, Columns, ChevronDown, X, Save } from 'lucide-react';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { LocationType, LocationTypeLabels } from '@entities/locations/enums';

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

interface LocationsTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  nameFilter: string;
  setNameFilter: (name: string) => void;
  addressFilter: string;
  setAddressFilter: (address: string) => void;
  districtFilter: string;
  setDistrictFilter: (district: string) => void;
  cityFilter: string;
  setCityFilter: (city: string) => void;
  countryFilter: string;
  setCountryFilter: (country: string) => void;
  regionFilter: string;
  setRegionFilter: (region: string) => void;
  typeFilter: LocationType[];
  handleTypeFilterChange: (types: LocationType[]) => void;
  isActiveFilter: boolean | null;
  setIsActiveFilter: (isActive: boolean | null) => void;
  handleIsActiveFilterChange: (isActive: boolean | null) => void;
  popular1Filter: boolean | null;
  setPopular1Filter: (popular1: boolean | null) => void;
  isLandingOnlyFilter: boolean | null;
  setIsLandingOnlyFilter: (val: boolean | null) => void;
  pageSize: number;
  handlePageSizeChange: (size: number) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  columnVisibility: ColumnVisibility;
  handleColumnVisibilityChange: (column: keyof ColumnVisibility, visible: boolean) => void;
  onSaveFilters?: () => void;
  onClearSavedFilters?: () => void;
  hasSavedFilters?: boolean;
  justSavedFilters?: boolean;
}

export function LocationsTableFilters({
  searchTerm,
  setSearchTerm,
  nameFilter,
  setNameFilter,
  addressFilter,
  setAddressFilter,
  districtFilter,
  setDistrictFilter,
  cityFilter,
  setCityFilter,
  countryFilter,
  setCountryFilter,
  regionFilter,
  setRegionFilter,
  typeFilter,
  handleTypeFilterChange,
  isActiveFilter,
  setIsActiveFilter,
  handleIsActiveFilterChange,
  popular1Filter,
  setPopular1Filter,
  isLandingOnlyFilter,
  setIsLandingOnlyFilter,
  pageSize,
  handlePageSizeChange,
  showAdvancedFilters,
  setShowAdvancedFilters,
  columnVisibility,
  handleColumnVisibilityChange,
  onSaveFilters,
  onClearSavedFilters,
  hasSavedFilters,
  justSavedFilters,
}: LocationsTableFiltersProps) {
  const handleTypeChange = (type: LocationType, checked: boolean) => {
    if (checked) {
      handleTypeFilterChange([...typeFilter, type]);
    } else {
      handleTypeFilterChange(typeFilter.filter(t => t !== type));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setNameFilter('');
    setAddressFilter('');
    setDistrictFilter('');
    setCityFilter('');
    setCountryFilter('');
    setRegionFilter('');
    handleTypeFilterChange([]);
    setIsActiveFilter(null);
    setPopular1Filter(null);
    setIsLandingOnlyFilter(null);
  };

  const activeFiltersCount = [
    searchTerm,
    nameFilter,
    addressFilter,
    districtFilter,
    cityFilter,
    countryFilter,
    regionFilter,
  ].filter(Boolean).length + 
  typeFilter.length + 
  (isActiveFilter !== null ? 1 : 0) +
  (popular1Filter !== null ? 1 : 0) +
  (isLandingOnlyFilter !== null ? 1 : 0);

  return (
    <>
      {/* Основные фильтры */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between overflow-x-auto py-2'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Поиск локаций...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 w-full md:w-80'
            />
          </div>

          <Select
            value={isActiveFilter === null ? 'all' : isActiveFilter.toString()}
            onValueChange={(value) => handleIsActiveFilterChange(value === 'all' ? null : value === 'true')}
          >
            <SelectTrigger className='w-full md:w-40'>
              <SelectValue placeholder='Статус' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Все</SelectItem>
              <SelectItem value='true'>Активные</SelectItem>
              <SelectItem value='false'>Неактивные</SelectItem>
            </SelectContent>
          </Select>

          <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
            <SelectTrigger className='w-full md:w-32'>
              <SelectValue placeholder='Размер' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='10'>10</SelectItem>
              <SelectItem value='25'>25</SelectItem>
              <SelectItem value='50'>50</SelectItem>
              <SelectItem value='100'>100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-2 pr-4'>
          <div className='relative'>
            <Button
              variant={showAdvancedFilters ? 'default' : 'outline'}
              className='w-full md:w-auto'
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className='mr-2 h-4 w-4' />
              Фильтры
              {activeFiltersCount > 0 && (
                <Badge variant='secondary' className='ml-1'>
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearAllFilters}
                className='absolute -top-2 -right-2 h-5 w-5 p-0 bg-white border border-gray-300 rounded-full hover:scale-105 transition-transform'
              >
                <X className='h-3 w-3 text-red-500' />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Расширенные фильтры */}
      {showAdvancedFilters && (
        <div className='rounded-lg border bg-card p-4 space-y-2'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium'>Фильтры</h3>
            <div className='flex items-center gap-2'>
              {onSaveFilters && (
                <div className='flex items-center gap-3'>
                  {/* Текст-индикатор состояния */}
                  <span className={`text-sm font-medium ${
                    justSavedFilters ? 'text-green-600' :
                    hasSavedFilters ? 'text-blue-600' :
                    'text-gray-500'
                  }`}>
                    {justSavedFilters ? 'Сохранено!' : hasSavedFilters ? 'Запоминание Фильтров включено' : 'Запоминание фильтров отключено'}
                  </span>

                  {/* Кнопка действия */}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={hasSavedFilters ? onClearSavedFilters : onSaveFilters}
                    title={hasSavedFilters ? 'Отключить автоматические фильтры' : 'Включить автоматическое применение фильтров'}
                    className={`h-8 w-8 p-0 transition-all duration-200 ${
                      hasSavedFilters ? 'text-red-500 hover:text-red-600 hover:bg-red-50' :
                      'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {hasSavedFilters ? (
                      <X className='h-4 w-4' />
                    ) : (
                      <Save className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              )}
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline'>
                  <Columns className='mr-2 h-4 w-4' />
                  Настроить колонки
                  <ChevronDown className='ml-2 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='w-48'>
                {[
                  { key: 'type', label: 'Тип' },
                  { key: 'name', label: 'Название' },
                  { key: 'address', label: 'Адрес' },
                  { key: 'district', label: 'Район' },
                  { key: 'city', label: 'Город' },
                  { key: 'country', label: 'Страна' },
                  { key: 'region', label: 'Регион' },
                  { key: 'coordinates', label: 'Координаты' },
                  { key: 'isActive', label: 'Активность' },
                  { key: 'popular1', label: 'Топ точки' },
                  { key: 'actions', label: 'Действия' },
                ].map(column => (
                  <DropdownMenuItem
                    key={column.key}
                    className='flex items-center space-x-2 cursor-pointer'
                    onSelect={e => {
                      e.preventDefault();
                      handleColumnVisibilityChange(
                        column.key as keyof ColumnVisibility,
                        !columnVisibility[column.key as keyof ColumnVisibility],
                      );
                    }}
                  >
                    <Checkbox
                      checked={columnVisibility[column.key as keyof ColumnVisibility]}
                      className='pointer-events-none'
                    />
                    <span className='text-sm'>{column.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            <div>
              <Label htmlFor='name'>Название</Label>
              <Input
                id='name'
                placeholder='Введите название...'
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='address'>Адрес</Label>
              <Input
                id='address'
                placeholder='Введите адрес...'
                value={addressFilter}
                onChange={(e) => setAddressFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='district'>Район</Label>
              <Input
                id='district'
                placeholder='Введите район...'
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='city'>Город</Label>
              <Input
                id='city'
                placeholder='Введите город...'
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='country'>Страна</Label>
              <Input
                id='country'
                placeholder='Введите страну...'
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='region'>Регион</Label>
              <Input
                id='region'
                placeholder='Введите регион...'
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              />
            </div>



            <div>
              <Label htmlFor='popular1'>Топ точки</Label>
              <Select
                value={popular1Filter === null ? 'all' : popular1Filter.toString()}
                onValueChange={(value) => setPopular1Filter(value === 'all' ? null : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Выберите' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  <SelectItem value='true'>Да</SelectItem>
                  <SelectItem value='false'>Нет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='isLandingOnly'>Лендинг</Label>
              <Select
                value={isLandingOnlyFilter === null ? 'all' : isLandingOnlyFilter.toString()}
                onValueChange={(value) => setIsLandingOnlyFilter(value === 'all' ? null : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Выберите' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все</SelectItem>
                  <SelectItem value='true'>Да</SelectItem>
                  <SelectItem value='false'>Нет</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Фильтры с чекбоксами */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Типы локаций */}
            <div>
              <Label className='text-sm font-medium'>Тип локации</Label>
              <div className='mt-2 space-y-2 max-h-40 overflow-y-auto'>
                {Object.entries(LocationTypeLabels).map(([value, label]) => (
                  <div key={value} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`type-${value}`}
                      checked={typeFilter.includes(value as LocationType)}
                      onCheckedChange={(checked) => handleTypeChange(value as LocationType, !!checked)}
                    />
                    <Label htmlFor={`type-${value}`} className='text-sm'>
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
