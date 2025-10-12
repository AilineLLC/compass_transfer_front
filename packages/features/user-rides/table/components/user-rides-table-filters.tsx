'use client';

import { Search, Filter, Columns, ChevronDown, X, RefreshCw } from 'lucide-react';
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

interface ColumnVisibility {
  status: boolean;
  subStatus: boolean;
  orderNumber: boolean;
  orderType: boolean;
  price: boolean;
  flight: boolean;
  duration: boolean;
  createdAt: boolean;
  scheduledTime: boolean;
  actions: boolean;
}

interface UserRidesTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string[];
  handleStatusFilterChange: (statuses: string[]) => void;
  pageSize: number;
  handlePageSizeChange: (size: number) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  columnVisibility: ColumnVisibility;
  handleColumnVisibilityChange: (column: keyof ColumnVisibility, visible: boolean) => void;
  _totalCount: number;
  onRefresh: () => void;
}

const rideStatuses = [
  { value: 'Requested', label: 'Запрошена' },
  { value: 'Searching', label: 'Поиск водителя' },
  { value: 'Accepted', label: 'Принята водителем' },
  { value: 'Arrived', label: 'Водитель прибыл' },
  { value: 'InProgress', label: 'В процессе' },
  { value: 'Completed', label: 'Завершена' },
  { value: 'Cancelled', label: 'Отменена' },
];

export function UserRidesTableFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  handleStatusFilterChange,
  pageSize,
  handlePageSizeChange,
  showAdvancedFilters,
  setShowAdvancedFilters,
  columnVisibility,
  handleColumnVisibilityChange,
  _totalCount,
  onRefresh,
}: UserRidesTableFiltersProps) {
  const handleStatusToggle = (status: string) => {
    const newStatuses = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status];

    handleStatusFilterChange(newStatuses);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    handleStatusFilterChange([]);
  };

  const activeFiltersCount = statusFilter.length + (searchTerm ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Основная строка с поиском и кнопками */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          {/* Поиск */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Поиск по ID поездки..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Кнопка фильтров */}
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Фильтры
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </Button>

          {/* Очистить фильтры */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2">
              <X className="h-4 w-4" />
              Очистить
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {/* Размер страницы */}
          <div className="flex items-center gap-2">
            <Label htmlFor="pageSize" className="text-sm whitespace-nowrap">
              Показать:
            </Label>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Управление колонками */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns className="h-4 w-4" />
                Колонки
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {Object.entries(columnVisibility).map(([column, visible]) => (
                <DropdownMenuItem key={column} className="flex items-center gap-2" asChild>
                  <label className="cursor-pointer">
                    <Checkbox
                      checked={visible}
                      onCheckedChange={(checked) =>
                        handleColumnVisibilityChange(column as keyof ColumnVisibility, !!checked)
                      }
                    />
                    <span className="capitalize">
                      {column === 'status' && 'Статус заказа'}
                      {column === 'subStatus' && 'Подстатус заказа'}
                      {column === 'orderNumber' && '№ Заказа'}
                      {column === 'orderType' && 'Тип заказа'}
                      {column === 'price' && 'Цена'}
                      {column === 'flight' && 'Рейс'}
                      {column === 'duration' && 'Длительность'}
                      {column === 'createdAt' && 'Создан'}
                      {column === 'scheduledTime' && 'Запланировано'}
                      {column === 'actions' && 'Действия'}
                    </span>
                  </label>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Кнопка обновить */}
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>


        </div>
      </div>

      {/* Расширенные фильтры */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
          {/* Фильтр по статусу */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Статус поездки</Label>
            <div className="space-y-2">
              {rideStatuses.map((status) => (
                <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={statusFilter.includes(status.value)}
                    onCheckedChange={() => handleStatusToggle(status.value)}
                  />
                  <span className="text-sm">{status.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
