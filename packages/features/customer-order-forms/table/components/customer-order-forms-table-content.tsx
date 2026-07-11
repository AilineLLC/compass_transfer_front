'use client';

import { ChevronUp, ChevronDown, MoreHorizontal, Eye, Car } from 'lucide-react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/data-display/table';
import { Button } from '@shared/ui/forms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { Badge } from '@shared/ui/data-display/badge';
import type { CustomerOrderFormDTO, CustomerOrderFormStatus } from '@shared/api/customer-order-forms';

interface CustomerOrderFormsTableContentProps {
  forms: CustomerOrderFormDTO[];
  router: AppRouterInstance;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
}

interface SortableHeaderProps {
  field: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  children: React.ReactNode;
}

function SortableHeader({ field, sortBy, sortOrder, onSort, children }: SortableHeaderProps) {
  const isActive = sortBy === field;
  return (
    <TableHead
      className='cursor-pointer hover:bg-muted/50 select-none'
      onClick={() => onSort(field)}
    >
      <div className='flex items-center gap-1'>
        {children}
        {isActive &&
          (sortOrder === 'asc' ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          ))}
      </div>
    </TableHead>
  );
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusBadge = (status: CustomerOrderFormStatus) => {
  switch (status) {
    case 'Verified':
      return (
        <Badge variant='outline' className='text-green-700 border-green-300 bg-green-50'>
          Принято
        </Badge>
      );
    case 'Rejected':
      return (
        <Badge variant='outline' className='text-red-700 border-red-300 bg-red-50'>
          Отклонено
        </Badge>
      );
    default:
      return (
        <Badge variant='outline' className='text-amber-700 border-amber-300 bg-amber-50'>
          Ожидает
        </Badge>
      );
  }
};

export function CustomerOrderFormsTableContent({
  forms,
  router,
  sortBy,
  sortOrder,
  handleSort,
}: CustomerOrderFormsTableContentProps) {
  if (forms.length === 0) {
    return (
      <div className='rounded-md border'>
        <div className='text-center py-12 text-muted-foreground'>Заявки не найдены</div>
      </div>
    );
  }
  
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Статус</TableHead>
            <TableHead>Пассажир</TableHead>
            <TableHead>Откуда</TableHead>
            <TableHead>Куда</TableHead>
            <TableHead>Автомобиль</TableHead>
            <TableHead>Дата поездки</TableHead>
            <TableHead>Услуги</TableHead>
            <SortableHeader
              field='createdAt'
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            >
              Создана
            </SortableHeader>
            <TableHead className='w-[50px]'>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map(form => (
            <TableRow
              key={form.id}
              className='hover:bg-muted/50 cursor-pointer'
              onClick={() => router.push(`/order-forms/${form.id}`)}
            >
              <TableCell>{statusBadge(form.status)}</TableCell>
              <TableCell>
                {form.name || form.phone ? (
                  <div className='flex flex-col gap-0.5'>
                    {form.name && <span className='text-sm font-medium'>{form.name}</span>}
                    {form.phone && <span className='text-xs text-muted-foreground'>{form.phone}</span>}
                  </div>
                ) : (
                  <span className='text-muted-foreground'>—</span>
                )}
              </TableCell>
              <TableCell className='max-w-[160px]'>
                <div className='flex flex-col gap-0.5 truncate'>
                  <span className='text-sm font-medium truncate' title={form.startLocation?.name ?? '—'}>
                    {form.startLocation?.name ?? '—'}
                  </span>
                  {form.startLocation?.city && (
                    <span className='text-xs text-muted-foreground truncate'>
                      {form.startLocation.city}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className='max-w-[160px]'>
                <div className='flex flex-col gap-0.5 truncate'>
                  <span className='text-sm font-medium truncate' title={form.endLocation?.name ?? '—'}>
                    {form.endLocation?.name ?? '—'}
                  </span>
                  {form.endLocation?.city && (
                    <span className='text-xs text-muted-foreground truncate'>
                      {form.endLocation.city}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {form.car ? (
                  <div className='flex flex-col gap-0.5'>
                    <span className='flex items-center gap-1.5 text-sm font-medium'>
                      <Car className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                      {form.car.make} {form.car.model}
                    </span>
                    <span className='text-xs text-muted-foreground font-mono'>{form.car.licensePlate}</span>
                  </div>
                ) : (
                  <span className='text-muted-foreground'>—</span>
                )}
              </TableCell>
              <TableCell>
                {form.scheduledTime ? (
                  <span className='text-sm'>{formatDate(form.scheduledTime)}</span>
                ) : (
                  <span className='text-muted-foreground'>—</span>
                )}
              </TableCell>
              <TableCell>
                {form.services.length > 0 ? (
                  <div className='flex flex-col gap-0.5'>
                    <span className='text-sm'>
                      {form.services.length} {form.services.length === 1 ? 'услуга' : 'услуг(и)'}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {form.services.reduce((s, i) => s + i.service.price * i.quantity, 0).toLocaleString('ru-RU')} сом
                    </span>
                  </div>
                ) : (
                  <span className='text-muted-foreground'>—</span>
                )}
              </TableCell>
              <TableCell>{formatDate(form.createdAt)}</TableCell>
              <TableCell onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0'
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => router.push(`/order-forms/${form.id}`)}>
                      <Eye className='mr-2 h-4 w-4' />
                      Просмотр
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
