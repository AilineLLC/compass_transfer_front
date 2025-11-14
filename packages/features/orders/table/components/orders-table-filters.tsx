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
import { type OrderStatus, OrderStatusValues } from '@entities/orders/enums/OrderStatus.enum';
import { type OrderSubStatus, OrderSubStatusValues } from '@entities/orders/enums/OrderSubStatus.enum';
import { type OrderType, OrderTypeValues } from '@entities/orders/enums/OrderType.enum';
import { orderTypeLabels, orderStatusLabels, orderSubStatusLabels } from '@entities/orders';

interface ColumnVisibility {
  orderNumber: boolean;
  type: boolean;
  status: boolean;
  subStatus: boolean;
  initialPrice: boolean;
  finalPrice: boolean;
  createdAt: boolean;
  completedAt: boolean;
  scheduledTime: boolean;
  actions: boolean;
}

interface OrdersTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  typeFilter: OrderType[];
  handleTypeFilterChange: (types: OrderType[]) => void;
  statusFilter: OrderStatus[];
  handleStatusFilterChange: (statuses: OrderStatus[]) => void;
  subStatusFilter: OrderSubStatus[];
  handleSubStatusFilterChange: (subStatuses: OrderSubStatus[]) => void;
  airFlightInput: string;
  setAirFlightInput: (airFlight: string) => void;
  flyReisInput: string;
  setFlyReisInput: (flyReis: string) => void;
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



export function OrdersTableFilters({
  searchTerm,
  setSearchTerm,
  typeFilter,
  handleTypeFilterChange,
  statusFilter,
  handleStatusFilterChange,
  subStatusFilter,
  handleSubStatusFilterChange,
  airFlightInput,
  setAirFlightInput,
  flyReisInput,
  setFlyReisInput,
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
}: OrdersTableFiltersProps) {
  const handleTypeChange = (type: OrderType, checked: boolean) => {
    if (checked) {
      handleTypeFilterChange([...typeFilter, type]);
    } else {
      handleTypeFilterChange(typeFilter.filter(t => t !== type));
    }
  };

  const handleStatusChange = (status: OrderStatus, checked: boolean) => {
    if (checked) {
      handleStatusFilterChange([...statusFilter, status]);
    } else {
      handleStatusFilterChange(statusFilter.filter(s => s !== status));
    }
  };

  const handleSubStatusChange = (subStatus: OrderSubStatus, checked: boolean) => {
    if (checked) {
      handleSubStatusFilterChange([...subStatusFilter, subStatus]);
    } else {
      handleSubStatusFilterChange(subStatusFilter.filter(ss => ss !== subStatus));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    handleTypeFilterChange([]);
    handleStatusFilterChange([]);
    handleSubStatusFilterChange([]);
    setAirFlightInput('');
    setFlyReisInput('');
  };

  const activeFiltersCount = [
    airFlightInput,
    flyReisInput,
  ].filter(Boolean).length +
  typeFilter.length +
  statusFilter.length +
  subStatusFilter.length;

  return (
    <>
      {/* Основные фильтры */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between overflow-x-auto py-2'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Точный номер заказа...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 w-full md:w-80'
            />
          </div>

          {/* Фильтр типа заказа */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='w-full md:w-auto'>
                Тип заказа
                {typeFilter.length > 0 && (
                  <Badge variant='secondary' className='ml-2'>
                    {typeFilter.length}
                  </Badge>
                )}
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-56'>
              <div className='p-2 space-y-2'>
                {OrderTypeValues.map((type) => (
                  <div key={type} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`main-type-${type}`}
                      checked={typeFilter.includes(type)}
                      onCheckedChange={(checked) => handleTypeChange(type, !!checked)}
                    />
                    <Label htmlFor={`main-type-${type}`} className='text-sm cursor-pointer'>
                      {orderTypeLabels[type]}
                    </Label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* Активные фильтры типа заказа */}
      {typeFilter.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          <span className='text-sm text-muted-foreground'>Типы заказов:</span>
          {typeFilter.map((type) => (
            <Badge
              key={type}
              variant='secondary'
              className='cursor-pointer hover:bg-destructive hover:text-destructive-foreground'
              onClick={() => handleTypeChange(type, false)}
            >
              {orderTypeLabels[type]}
              <X className='ml-1 h-3 w-3' />
            </Badge>
          ))}
        </div>
      )}

      {/* Расширенные фильтры */}
      {showAdvancedFilters && (
        <div className='rounded-lg border bg-card p-4 space-y-2'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium'>Фильтры</h3>
            <div className='flex items-center gap-2'>
              {onSaveFilters && (
                <div className='flex items-center gap-3'>
                  <span className={`text-sm font-medium ${
                    justSavedFilters ? 'text-green-600' :
                    hasSavedFilters ? 'text-blue-600' :
                    'text-gray-500'
                  }`}>
                    {justSavedFilters ? 'Сохранено!' : hasSavedFilters ? 'Запоминание Фильтров включено' : 'Запоминание фильтров отключено'}
                  </span>

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
                  { key: 'orderNumber', label: 'Номер заказа' },
                  { key: 'type', label: 'Тип' },
                  { key: 'status', label: 'Статус' },
                  { key: 'subStatus', label: 'Подстатус' },
                  { key: 'initialPrice', label: 'Начальная цена' },
                  { key: 'finalPrice', label: 'Итоговая цена' },
                  { key: 'createdAt', label: 'Создан' },
                  { key: 'completedAt', label: 'Завершен' },
                  { key: 'scheduledTime', label: 'Запланирован' },
                  { key: 'airFlight', label: 'Рейс (прилет)' },
                  { key: 'flyReis', label: 'Рейс (вылет)' },
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

            <div>
              <Label htmlFor='airFlight'>Номер рейса (прилет)</Label>
              <Input
                id='airFlight'
                placeholder='Введите номер рейса прилета...'
                value={airFlightInput}
                onChange={(e) => setAirFlightInput(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='flyReis'>Номер рейса (вылет)</Label>
              <Input
                id='flyReis'
                placeholder='Введите номер рейса вылета (только A-Z, 0-9, пробел, дефис)...'
                value={flyReisInput}
                onChange={(e) => setFlyReisInput(e.target.value)}
              />
            </div>
          </div>

          {/* Фильтры с чекбоксами */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Статусы заказов */}
            <div>
              <Label className='text-sm font-medium'>Статус заказа</Label>
              <div className='mt-2 space-y-2 max-h-40 overflow-y-auto'>
                {OrderStatusValues.map((status) => (
                  <div key={status} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`status-${status}`}
                      checked={statusFilter.includes(status)}
                      onCheckedChange={(checked) => handleStatusChange(status, !!checked)}
                    />
                    <Label htmlFor={`status-${status}`} className='text-sm'>
                      {orderStatusLabels[status]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Подстатусы заказов */}
            <div>
              <Label className='text-sm font-medium'>Подстатус заказа</Label>
              <div className='mt-2 space-y-2 max-h-40 overflow-y-auto'>
                {OrderSubStatusValues.map((subStatus) => (
                  <div key={subStatus} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`subStatus-${subStatus}`}
                      checked={subStatusFilter.includes(subStatus)}
                      onCheckedChange={(checked) => handleSubStatusChange(subStatus, !!checked)}
                    />
                    <Label htmlFor={`subStatus-${subStatus}`} className='text-sm'>
                      {orderSubStatusLabels[subStatus]}
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
