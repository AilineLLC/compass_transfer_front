'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { DatePicker } from '@shared/ui/forms/date-picker';
import { Label } from '@shared/ui/forms/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/modals/dialog';
import { exportOrdersToExcel } from '../utils/export-orders-to-excel';
import { ordersApi, type OrderFilters } from '@shared/api/orders';
import { useUserRole } from '@shared/contexts';
import { Role } from '@entities/users/enums';
import { toast } from 'sonner';

interface OrdersExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: {
    typeFilter?: string[];
    statusFilter?: string[];
    subStatusFilter?: string[];
    airFlight?: string;
    flyReis?: string;
  };
}

export function OrdersExportModal({
  isOpen,
  onClose,
  currentFilters,
}: OrdersExportModalProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const { userRole } = useUserRole();

  const handleExport = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error('Дата начала не может быть больше даты окончания');
      return;
    }

    setIsExporting(true);

    try {
      // Устанавливаем время для корректного фильтра, если даты выбраны
      let fromDate: Date | undefined;
      let toDate: Date | undefined;
      
      if (dateFrom) {
        fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
      }
      
      if (dateTo) {
        toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
      }

      // Собираем все заказы за период
      const allOrders = [];
      let cursor: string | null = null;
      let hasMore = true;
      const pageSize = 100; // Большой размер страницы для экспорта

      while (hasMore) {
        const params: OrderFilters = {
          first: cursor === null,
          after: cursor || undefined,
          size: pageSize,
          sortBy: 'createdAt',
          sortOrder: 'Desc',
        };

        // Применяем фильтры по датам, если они выбраны
        if (fromDate) {
          params.createdAt = fromDate.toISOString();
          params.createdAtOp = 'GreaterThanOrEqual';
        }

        // Применяем дополнительные фильтры из текущих фильтров таблицы
        if (currentFilters) {
          if (currentFilters.typeFilter && currentFilters.typeFilter.length > 0) {
            params.type = currentFilters.typeFilter as any;
          }
          if (currentFilters.statusFilter && currentFilters.statusFilter.length > 0) {
            params.status = currentFilters.statusFilter as any;
          }
          if (currentFilters.subStatusFilter && currentFilters.subStatusFilter.length > 0) {
            params.subStatus = currentFilters.subStatusFilter as any;
          }
          if (currentFilters.airFlight) {
            params.airFlight = currentFilters.airFlight;
            params.airFlightOp = 'Contains';
          }
          if (currentFilters.flyReis) {
            params.flyReis = currentFilters.flyReis;
            params.flyReisOp = 'Contains';
          }
        }

        const response = userRole === Role.Partner
          ? await ordersApi.getMyCreatorOrders(params)
          : await ordersApi.getOrders(params);

        // Фильтруем по датам вручную, если даты выбраны
        let filtered = response.data;
        if (fromDate || toDate) {
          filtered = response.data.filter(order => {
            const orderDate = new Date(order.createdAt);
            if (fromDate && orderDate < fromDate) return false;
            if (toDate && orderDate > toDate) return false;
            return true;
          });
        }

        allOrders.push(...filtered);
        
        // Проверяем, есть ли еще данные
        if (response.data.length === 0) {
          hasMore = false;
        } else {
          // Проверяем, не вышли ли мы за пределы диапазона
          if (fromDate || toDate) {
            const lastOrderDate = new Date(response.data[response.data.length - 1].createdAt);
            if (fromDate && lastOrderDate < fromDate) {
              hasMore = false;
            } else if (toDate && lastOrderDate > toDate) {
              hasMore = false;
            } else {
              hasMore = response.hasNext;
              if (hasMore) {
                cursor = response.data[response.data.length - 1].id;
              }
            }
          } else {
            hasMore = response.hasNext;
            if (hasMore) {
              cursor = response.data[response.data.length - 1].id;
            }
          }
        }
      }

      const filteredOrders = allOrders;

      if (filteredOrders.length === 0) {
        toast.info('Нет заказов для экспорта за выбранный период');
        setIsExporting(false);
        return;
      }

      // Экспортируем в Excel
      await exportOrdersToExcel(filteredOrders, dateFrom || undefined, dateTo || undefined);
      toast.success(`Экспортировано ${filteredOrders.length} заказов`);
      onClose();
    } catch (error) {
      console.error('Ошибка при экспорте заказов:', error);
      toast.error('Ошибка при экспорте заказов. Попробуйте еще раз.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    if (date && dateTo && date > dateTo) {
      setDateTo(undefined);
    }
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    if (date && dateFrom && date < dateFrom) {
      setDateFrom(undefined);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Экспорт заказов в Excel</DialogTitle>
          <DialogDescription>
            Выберите период для экспорта заказов (необязательно). Если период не выбран, будут экспортированы все заказы с учетом текущих фильтров.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date-from">Дата начала (необязательно)</Label>
            <DatePicker
              id="date-from"
              value={dateFrom}
              onChange={handleDateFromChange}
              placeholder="Выберите дату начала"
              modal={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-to">Дата окончания (необязательно)</Label>
            <DatePicker
              id="date-to"
              value={dateTo}
              onChange={handleDateToChange}
              placeholder="Выберите дату окончания"
              modal={true}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Отмена
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Экспорт...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Экспортировать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
