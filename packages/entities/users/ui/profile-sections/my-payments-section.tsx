'use client';

import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { MyPaymentsTable } from '@features/payments/table/my-payments-table';

export function MyPaymentsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <DollarSign className='h-5 w-5' />
          Мои платежи
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MyPaymentsTable />
      </CardContent>
    </Card>
  );
}
