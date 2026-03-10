'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, Users } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { DatePicker } from '@shared/ui/forms/date-picker';
import { Label } from '@shared/ui/forms/label';
import { Checkbox } from '@shared/ui/forms/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/forms/select';
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
import { usersApi } from '@shared/api/users';
import { useUserRole } from '@shared/contexts';
import { Role } from '@entities/users/enums';
import type { GetUserBasicDTO } from '@entities/users/interface';
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
  const [applyTableFilters, setApplyTableFilters] = useState(true);

  // Partners / counterparties
  const [partners, setPartners] = useState<GetUserBasicDTO[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');

  // Order count preview
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);

  const { userRole } = useUserRole();

  // ──────────────────────────────────────────────────────────
  // Load partners when the modal opens
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoadingPartners(true);

    usersApi
      .getUsers({ role: Role.Partner, size: 200, sortBy: 'fullName', sortOrder: 'Asc' })
      .then((res) => {
        if (!cancelled) setPartners(res.data);
      })
      .catch(() => {
        if (!cancelled) toast.error('Не удалось загрузить список контрагентов');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPartners(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // ──────────────────────────────────────────────────────────
  // Reset state when modal closes
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setDateFrom(undefined);
      setDateTo(undefined);
      setSelectedPartnerId('all');
      setApplyTableFilters(true);
      setOrderCount(null);
    }
  }, [isOpen]);

  // ──────────────────────────────────────────────────────────
  // Build params helper (shared between count + export)
  // ──────────────────────────────────────────────────────────
  const buildParams = useCallback(
    (fromDate: Date | undefined, toDate: Date | undefined): OrderFilters => {
      const params: OrderFilters = {
        sortBy: 'createdAt',
        sortOrder: 'Desc',
      };

      if (fromDate) {
        params.createdAt = fromDate.toISOString();
        params.createdAtOp = 'GreaterThanOrEqual';
      }

      if (selectedPartnerId !== 'all') {
        params.creatorId = selectedPartnerId;
      }

      if (applyTableFilters && currentFilters) {
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

      return params;
    },
    [selectedPartnerId, applyTableFilters, currentFilters],
  );

  // ──────────────────────────────────────────────────────────
  // Fetch order count whenever filters change
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsCountLoading(true);
    setOrderCount(null);

    const fromDate = dateFrom ? (() => { const d = new Date(dateFrom); d.setHours(0, 0, 0, 0); return d; })() : undefined;
    const toDate = dateTo ? (() => { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); return d; })() : undefined;

    const params = { ...buildParams(fromDate, toDate), size: 1, first: true };

    const fetchCount = userRole === Role.Partner
      ? ordersApi.getMyCreatorOrders(params)
      : ordersApi.getOrders(params);

    fetchCount
      .then((res) => {
        if (!cancelled) setOrderCount(res.totalCount);
      })
      .catch(() => {
        if (!cancelled) setOrderCount(null);
      })
      .finally(() => {
        if (!cancelled) setIsCountLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, dateFrom, dateTo, selectedPartnerId, applyTableFilters, buildParams, userRole]);

  // ──────────────────────────────────────────────────────────
  // Export
  // ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error('Дата начала не может быть больше даты окончания');
      return;
    }

    setIsExporting(true);

    try {
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

      const allOrders = [];
      let cursor: string | null = null;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore) {
        const params: OrderFilters = {
          ...buildParams(fromDate, toDate),
          first: cursor === null,
          after: cursor || undefined,
          size: pageSize,
        };

        const response =
          userRole === Role.Partner
            ? await ordersApi.getMyCreatorOrders(params)
            : await ordersApi.getOrders(params);

        // Manual date range filter for the toDate boundary
        let filtered = response.data;
        if (fromDate || toDate) {
          filtered = response.data.filter((order) => {
            const orderDate = new Date(order.createdAt);
            if (fromDate && orderDate < fromDate) return false;
            if (toDate && orderDate > toDate) return false;
            return true;
          });
        }

        allOrders.push(...filtered);

        if (response.data.length === 0) {
          hasMore = false;
        } else if (fromDate || toDate) {
          const lastOrderDate = new Date(response.data[response.data.length - 1].createdAt);
          if (fromDate && lastOrderDate < fromDate) {
            hasMore = false;
          } else if (toDate && lastOrderDate > toDate) {
            hasMore = false;
          } else {
            hasMore = response.hasNext;
            if (hasMore) cursor = response.data[response.data.length - 1].id;
          }
        } else {
          hasMore = response.hasNext;
          if (hasMore) cursor = response.data[response.data.length - 1].id;
        }
      }

      if (allOrders.length === 0) {
        toast.info('Нет заказов для экспорта за выбранный период');
        setIsExporting(false);
        return;
      }

      await exportOrdersToExcel(allOrders, dateFrom || undefined, dateTo || undefined);
      toast.success(`Экспортировано ${allOrders.length} заказов`);
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
    if (date && dateTo && date > dateTo) setDateTo(undefined);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    if (date && dateFrom && date < dateFrom) setDateFrom(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Экспорт заказов в Excel</DialogTitle>
          <DialogDescription>
            Выберите контрагента и/или период для экспорта. Если ничего не выбрано — экспортируются все заказы.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Partner select */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Контрагент
            </Label>
            {isLoadingPartners ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground h-10 px-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка контрагентов...
              </div>
            ) : (
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите контрагента" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все контрагенты</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date range */}
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

          {/* Apply table filters toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply-table-filters"
              checked={applyTableFilters}
              onCheckedChange={(checked) => setApplyTableFilters(!!checked)}
            />
            <Label htmlFor="apply-table-filters" className="cursor-pointer text-sm">
              Применить фильтры таблицы
            </Label>
          </div>

          {/* Order count preview */}
          <div className="rounded-md bg-muted px-4 py-3 text-sm flex items-center gap-2 min-h-[40px]">
            {isCountLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Подсчёт заказов...</span>
              </>
            ) : orderCount !== null ? (
              <span>
                Найдено заказов:{' '}
                <span className="font-semibold">{orderCount}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Отмена
          </Button>
          <Button onClick={handleExport} disabled={isExporting || isLoadingPartners}>
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
