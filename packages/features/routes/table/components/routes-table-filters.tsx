'use client';

import { Search, Columns, ChevronDown } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';

interface ColumnVisibility {
  name: boolean;
  startLocation: boolean;
  endLocation: boolean;
  price: boolean;
  duration: boolean;
  isPopular: boolean;
  actions: boolean;
}

interface RoutesTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isPopularFilter: boolean | null;
  setIsPopularFilter: (val: boolean | null) => void;
  pageSize: number;
  handlePageSizeChange: (size: number) => void;
  columnVisibility: ColumnVisibility;
  handleColumnVisibilityChange: (column: keyof ColumnVisibility, visible: boolean) => void;
}

const COLUMN_LABELS: Record<keyof ColumnVisibility, string> = {
  name: 'Название',
  startLocation: 'Точка А',
  endLocation: 'Точка Б',
  price: 'Цена',
  duration: 'Длительность',
  isPopular: 'Популярное',
  actions: 'Действия',
};

export function RoutesTableFilters({
  searchTerm,
  setSearchTerm,
  isPopularFilter,
  setIsPopularFilter,
  pageSize,
  handlePageSizeChange,
  columnVisibility,
  handleColumnVisibilityChange,
}: RoutesTableFiltersProps) {
  return (
    <div className='flex flex-wrap items-center gap-3 pt-2'>
      <div className='relative flex-1 min-w-[200px] max-w-sm'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Поиск по названию или локациям...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className='pl-9 focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md focus:shadow-md transition-shadow'
        />
      </div>

      <Select
        value={isPopularFilter === null ? 'all' : isPopularFilter ? 'true' : 'false'}
        onValueChange={val => {
          if (val === 'all') setIsPopularFilter(null);
          else setIsPopularFilter(val === 'true');
        }}
      >
        <SelectTrigger className='w-[160px] focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'>
          <SelectValue placeholder='Популярное' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Все</SelectItem>
          <SelectItem value='true'>Популярные</SelectItem>
          <SelectItem value='false'>Обычные</SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'>
            <Columns className='h-4 w-4 mr-2' />
            Колонки
            <ChevronDown className='h-4 w-4 ml-2' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          {(Object.keys(columnVisibility) as (keyof ColumnVisibility)[]).map(col => (
            <DropdownMenuItem
              key={col}
              onClick={() => handleColumnVisibilityChange(col, !columnVisibility[col])}
            >
              <span className={`mr-2 ${columnVisibility[col] ? 'text-green-600' : 'text-gray-400'}`}>
                {columnVisibility[col] ? '✓' : '○'}
              </span>
              {COLUMN_LABELS[col]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Select
        value={String(pageSize)}
        onValueChange={val => handlePageSizeChange(Number(val))}
      >
        <SelectTrigger className='w-[100px] focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 hover:shadow-md transition-shadow'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[10, 25, 50].map(size => (
            <SelectItem key={size} value={String(size)}>{size} / стр.</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
