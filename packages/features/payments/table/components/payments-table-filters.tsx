'use client';

import { Filter, RefreshCw, Columns, X } from 'lucide-react';
import { useState } from 'react';
import { PaymentType, PaymentGateway, PaymentStatus } from '@shared/api/payments';
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Label } from '@shared/ui/forms/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { paymentTypeLabels, paymentGatewayLabels, paymentStatusLabels } from '@entities/payments';

interface ColumnVisibility {
  type: boolean;
  gateway: boolean;
  status: boolean;
  amount: boolean;
  currency: boolean;
  reference: boolean;
  actions: boolean;
}

interface PaymentsTableFiltersProps {
  typeFilter: PaymentType[];
  gatewayFilter: PaymentGateway[];
  statusFilter: PaymentStatus[];
  setTypeFilter: (types: PaymentType[]) => void;
  setGatewayFilter: (gateways: PaymentGateway[]) => void;
  setStatusFilter: (statuses: PaymentStatus[]) => void;
  pageSize: number;
  handlePageSizeChange: (size: number) => void;
  columnVisibility: ColumnVisibility;
  handleColumnVisibilityChange: (column: keyof ColumnVisibility, visible: boolean) => void;
  onRefresh: () => void;
}

export function PaymentsTableFilters({
  typeFilter,
  gatewayFilter,
  statusFilter,
  setTypeFilter,
  setGatewayFilter,
  setStatusFilter,
  pageSize,
  handlePageSizeChange,
  columnVisibility,
  handleColumnVisibilityChange,
  onRefresh,
}: PaymentsTableFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleTypeToggle = (type: PaymentType) => {
    const newTypes = typeFilter.includes(type)
      ? typeFilter.filter(t => t !== type)
      : [...typeFilter, type];

    setTypeFilter(newTypes);
  };

  const handleGatewayToggle = (gateway: PaymentGateway) => {
    const newGateways = gatewayFilter.includes(gateway)
      ? gatewayFilter.filter(g => g !== gateway)
      : [...gatewayFilter, gateway];

    setGatewayFilter(newGateways);
  };

  const handleStatusToggle = (status: PaymentStatus) => {
    const newStatuses = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status];

    setStatusFilter(newStatuses);
  };

  const clearAllFilters = () => {
    setTypeFilter([]);
    setGatewayFilter([]);
    setStatusFilter([]);
  };

  const activeFiltersCount = 
    typeFilter.length + 
    gatewayFilter.length + 
    statusFilter.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Кнопка фильтров */}
          <Button
            variant={showAdvancedFilters ? 'default' : 'outline'}
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
          </Button>

          {/* Очистить фильтры */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2">
              <X className="h-4 w-4" />
              Очисть
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {/* Размер страницы */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Показать:</span>
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

          {/* Кнопка обновить */}
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Расширенные фильтры */}
      {showAdvancedFilters && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Фильтры</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Запоминание фильтров отключено</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Columns className="h-4 w-4" />
                    Настроить колонки
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
                          {column === 'type' && 'Тип'}
                          {column === 'gateway' && 'Шлюз'}
                          {column === 'status' && 'Статус'}
                          {column === 'amount' && 'Сумма'}
                          {column === 'currency' && 'Валюта'}
                          {column === 'reference' && 'Референс'}
                          {column === 'actions' && 'Действия'}
                        </span>
                      </label>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Фильтр по типу */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Тип платежа</Label>
            <div className="space-y-2">
              {Object.values(PaymentType).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={typeFilter.includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                  />
                  <span className="text-sm">{paymentTypeLabels[type]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Фильтр по шлюзу */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Платежный шлюз</Label>
            <div className="space-y-2">
              {Object.values(PaymentGateway).map((gateway) => (
                <label key={gateway} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={gatewayFilter.includes(gateway)}
                    onCheckedChange={() => handleGatewayToggle(gateway)}
                  />
                  <span className="text-sm">{paymentGatewayLabels[gateway]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Фильтр по статусу */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Статус платежа</Label>
            <div className="space-y-2">
              {Object.values(PaymentStatus).map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={statusFilter.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <span className="text-sm">{paymentStatusLabels[status]}</span>
                </label>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
