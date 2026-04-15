'use client';

import { Columns, ChevronDown, RotateCw } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Checkbox } from '@shared/ui/forms/checkbox';
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
  reservations: boolean;
  passengers: boolean;
  freeSeats: boolean;
  driver: boolean;
  car: boolean;
  createdAt: boolean;
  actions: boolean;
}

interface TransfersTableFiltersProps {
  pageSize: number;
  handlePageSizeChange: (size: number) => void;
  columnVisibility: ColumnVisibility;
  handleColumnVisibilityChange: (column: keyof ColumnVisibility, visible: boolean) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const COLUMNS: { key: keyof ColumnVisibility; label: string }[] = [
  { key: 'departureTime', label: 'Время отправления' },
  { key: 'startLocation', label: 'Откуда' },
  { key: 'endLocation', label: 'Куда' },
  { key: 'price', label: 'Цена' },
  { key: 'reservations', label: 'Заявки' },
  { key: 'passengers', label: 'Пассажиры' },
  { key: 'freeSeats', label: 'Свободных мест' },
  { key: 'driver', label: 'Водитель' },
  { key: 'car', label: 'Автомобиль' },
  { key: 'createdAt', label: 'Создан' },
  { key: 'actions', label: 'Действия' },
];

export function TransfersTableFilters({
  pageSize,
  handlePageSizeChange,
  columnVisibility,
  handleColumnVisibilityChange,
  onRefresh,
  isLoading,
}: TransfersTableFiltersProps) {
  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between overflow-x-auto py-2'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
        <Select
          value={pageSize.toString()}
          onValueChange={value => handlePageSizeChange(Number(value))}
        >
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
        <Button
          variant='outline'
          className='w-full md:w-auto text-blue-600 border-blue-200 hover:bg-blue-50'
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RotateCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='w-full md:w-auto'>
              <Columns className='mr-2 h-4 w-4' />
              Колонки
              <ChevronDown className='ml-2 h-4 w-4' />
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
  );
}
