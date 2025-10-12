'use client';

import { DollarSign, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { GetPaymentDTO } from '@shared/api/payments';
import { Badge } from '@shared/ui/data-display/badge';
import { Skeleton } from '@shared/ui/data-display/skeleton';
import { Button } from '@shared/ui/forms/button';
import { paymentTypeLabels, paymentGatewayLabels, paymentStatusLabels, paymentStatusColors, currencyLabels } from '@entities/payments';

interface ColumnVisibility {
  type: boolean;
  gateway: boolean;
  status: boolean;
  amount: boolean;
  currency: boolean;
  reference: boolean;
  actions: boolean;
}

interface PaymentsTableContentProps {
  payments: GetPaymentDTO[];
  loading: boolean;
  columnVisibility: ColumnVisibility;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string, order: 'asc' | 'desc') => void;
  onViewDetails: (paymentId: string) => void;
}

export function PaymentsTableContent({
  payments,
  loading,
  columnVisibility,
  sortBy,
  sortOrder,
  onSortChange,
  onViewDetails,
}: PaymentsTableContentProps) {
  const handleSort = (column: string) => {
    if (sortBy === column) {
      onSortChange(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }

    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="border rounded-lg">
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="border rounded-lg p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <DollarSign className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Платежи не найдены</h3>
            <p className="text-muted-foreground">Нет платежей, соответствующих выбранным фильтрам.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columnVisibility.type && (
                <th className="text-left p-3 font-medium">Тип</th>
              )}
              {columnVisibility.gateway && (
                <th className="text-left p-3 font-medium">Шлюз</th>
              )}
              {columnVisibility.status && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Статус
                    {getSortIcon('status')}
                  </Button>
                </th>
              )}
              {columnVisibility.amount && (
                <th className="text-left p-3 font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('amount')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Сумма
                    {getSortIcon('amount')}
                  </Button>
                </th>
              )}
              {columnVisibility.currency && (
                <th className="text-left p-3 font-medium">Валюта</th>
              )}
              {columnVisibility.reference && (
                <th className="text-left p-3 font-medium">Референс</th>
              )}
              {columnVisibility.actions && (
                <th className="text-left p-3 font-medium" />
              )}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t hover:bg-muted/25">
                {columnVisibility.type && (
                  <td className="p-3">
                    <span className="text-sm">{paymentTypeLabels[payment.type]}</span>
                  </td>
                )}
                {columnVisibility.gateway && (
                  <td className="p-3">
                    <span className="text-sm">{paymentGatewayLabels[payment.gateway]}</span>
                  </td>
                )}
                {columnVisibility.status && (
                  <td className="p-3">
                    <Badge className={`${paymentStatusColors[payment.status]} w-fit`}>
                      {paymentStatusLabels[payment.status]}
                    </Badge>
                  </td>
                )}
                {columnVisibility.amount && (
                  <td className="p-3">
                    <span className="text-sm font-semibold">{payment.amount.toLocaleString('ru-RU')}</span>
                  </td>
                )}
                {columnVisibility.currency && (
                  <td className="p-3">
                    <span className="text-sm">{currencyLabels[payment.currency]}</span>
                  </td>
                )}
                {columnVisibility.reference && (
                  <td className="p-3">
                    <span className="text-sm font-mono text-xs">{payment.reference}</span>
                  </td>
                )}
                {columnVisibility.actions && (
                  <td className="p-3">
                    <Button
                      onClick={() => onViewDetails(payment.id)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Подробнее"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
