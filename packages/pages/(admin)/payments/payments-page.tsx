'use client';

import { DollarSign } from 'lucide-react';
import { PaymentsTable } from '@features/payments/table/payments-table';

export function PaymentsPage() {
  return (
    <div className="pr-2 border rounded-2xl overflow-hidden shadow-sm h-full bg-white">
      <div className="overflow-y-auto h-full pl-4 pr-2">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Платежи</h1>
              <p className="text-muted-foreground">Управление платежами и транзакциями</p>
            </div>
          </div>
        </div>

        {/* Таблица платежей */}
        <div className="p-4">
          <PaymentsTable />
        </div>
      </div>
    </div>
  );
}
