'use client';

import { Columns, ChevronDown, RotateCw, ArrowUp, ArrowDown, Flame, ClipboardList, CalendarCheck, CalendarX } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Switch } from '@shared/ui/forms/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/forms/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';

interface ColumnVisibility {
  departureTime: boolean;
  startLocation: boolean;
  endLocation: boolean;
  price: boolean;
  distance: boolean;
  reservations: boolean;
  passengers: boolean;
  freeSeats: boolean;
  driver: boolean;
  car: boolean;
  actions: boolean;
}

interface TransfersTableFiltersProps {
  pageSize: number;
  handlePageSizeChange: (size: number) => void;
  columnVisibility: ColumnVisibility;
  handleColumnVisibilityChange: (column: keyof ColumnVisibility, visible: boolean) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  showActiveOnly: boolean;
  onShowActiveOnlyChange: (value: boolean) => void;
  hasPending?: boolean;
  isHot?: boolean;
  onHasPendingChange: (value: boolean | undefined) => void;
  onIsHotChange: (value: boolean | undefined) => void;
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Дата создания' },
  { value: 'departureTime', label: 'Дата отправления' },
];

const COLUMNS: { key: keyof ColumnVisibility; label: string }[] = [
  { key: 'departureTime', label: 'Время отправления' },
  { key: 'startLocation', label: 'Откуда' },
  { key: 'endLocation', label: 'Куда' },
  { key: 'price', label: 'Цена' },
  { key: 'distance', label: 'Расстояние' },
  { key: 'reservations', label: 'Заявки' },
  { key: 'passengers', label: 'Пассажиры' },
  { key: 'freeSeats', label: 'Свободных мест' },
  { key: 'driver', label: 'Водитель' },
  { key: 'car', label: 'Автомобиль' },
  { key: 'actions', label: 'Действия' },
];

export function TransfersTableFilters({
  pageSize,
  handlePageSizeChange,
  columnVisibility,
  handleColumnVisibilityChange,
  onRefresh,
  isLoading,
  sortBy,
  sortOrder,
  handleSort,
  showActiveOnly,
  onShowActiveOnlyChange,
  hasPending,
  isHot,
  onHasPendingChange,
  onIsHotChange,
}: TransfersTableFiltersProps) {
  const toggleSortOrder = () => handleSort(sortBy);

  return (
    <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
      {/* Табы: Активные / Прошедшие */}
      <div className='flex border-b'>
        <button
          type='button'
          onClick={() => onShowActiveOnlyChange(true)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            showActiveOnly
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <CalendarCheck className='h-4 w-4' />
          Активные
        </button>
        <button
          type='button'
          onClick={() => onShowActiveOnlyChange(false)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            !showActiveOnly
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <CalendarX className='h-4 w-4' />
          Прошедшие
        </button>
      </div>

      <div className='p-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>

        {/* Левая часть: сортировка + переключатели */}
        <div className='flex flex-wrap items-center gap-3'>

          {/* Сортировка */}
          <div className='flex items-center gap-1.5'>
            <Select value={sortBy} onValueChange={handleSort}>
              <SelectTrigger className='h-8 w-48 text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8 shrink-0'
              onClick={toggleSortOrder}
              title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className='h-4 w-4' />
              ) : (
                <ArrowDown className='h-4 w-4' />
              )}
            </Button>
          </div>

          <div className='h-6 w-px bg-border hidden sm:block' />

          {/* Переключатели */}
          <label className='flex items-center gap-2 cursor-pointer select-none'>
            <Switch
              checked={hasPending === true}
              onCheckedChange={checked => onHasPendingChange(checked ? true : undefined)}
            />
            <span className='flex items-center gap-1.5 text-sm font-medium'>
              <ClipboardList className='h-4 w-4 text-amber-500' />
              Новые заявки
            </span>
          </label>

          <label className='flex items-center gap-2 cursor-pointer select-none'>
            <Switch
              checked={isHot === true}
              onCheckedChange={checked => onIsHotChange(checked ? true : undefined)}
            />
            <span className='flex items-center gap-1.5 text-sm font-medium'>
              <Flame className='h-4 w-4 text-orange-500' />
              Горячие трансферы
            </span>
          </label>
        </div>

        {/* Правая часть: размер + кнопки */}
        <div className='flex items-center gap-2'>
          <Select
            value={pageSize.toString()}
            onValueChange={value => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className='h-8 w-20 text-sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='10'>10</SelectItem>
              <SelectItem value='25'>25</SelectItem>
              <SelectItem value='50'>50</SelectItem>
              <SelectItem value='100'>100</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant='outline'
            size='sm'
            className='h-8 text-blue-600 border-blue-200 hover:bg-blue-50'
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RotateCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='h-8'>
                <Columns className='mr-1.5 h-3.5 w-3.5' />
                Колонки
                <ChevronDown className='ml-1.5 h-3.5 w-3.5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              {COLUMNS.map(column => (
                <DropdownMenuItem
                  key={column.key}
                  className='flex items-center space-x-2 cursor-pointer'
                  onSelect={e => {
                    e.preventDefault();
                    handleColumnVisibilityChange(column.key, !columnVisibility[column.key]);
                  }}
                >
                  <Checkbox
                    checked={columnVisibility[column.key]}
                    className='pointer-events-none'
                  />
                  <span className='text-sm'>{column.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
      </div>
    </div>
  );
}
