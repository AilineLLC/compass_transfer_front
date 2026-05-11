'use client';

import { ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/data-display/table';
import { Button } from '@shared/ui/forms/button';
import { Badge } from '@shared/ui/data-display/badge';
import type { PartnerContactFormDTO, PartnerContactFormStatus } from '@shared/api/partner-contact-forms';

interface PartnerContactFormsTableContentProps {
  forms: PartnerContactFormDTO[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  handleUpdateStatus: (id: string, status: PartnerContactFormStatus) => Promise<void>;
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
    <TableHead className='cursor-pointer hover:bg-muted/50 select-none' onClick={() => onSort(field)}>
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

const statusBadge = (status: PartnerContactFormStatus) => {
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

function ActionCell({
  form,
  handleUpdateStatus,
}: {
  form: PartnerContactFormDTO;
  handleUpdateStatus: (id: string, status: PartnerContactFormStatus) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  if (form.status === 'Verified') {
    return (
      <span className='flex items-center gap-1.5 text-sm text-green-600'>
        <CheckCircle className='h-4 w-4' />
        Обработан
      </span>
    );
  }

  return (
    <Button
      variant='outline'
      size='sm'
      disabled={updating}
      className='text-green-700 border-green-300 hover:bg-green-50'
      onClick={async () => {
        setUpdating(true);
        try {
          await handleUpdateStatus(form.id, 'Verified');
        } finally {
          setUpdating(false);
        }
      }}
    >
      <CheckCircle className='mr-1.5 h-4 w-4' />
      Обработать
    </Button>
  );
}

export function PartnerContactFormsTableContent({
  forms,
  sortBy,
  sortOrder,
  handleSort,
  handleUpdateStatus,
}: PartnerContactFormsTableContentProps) {
  if (forms.length === 0) {
    return (
      <div className='rounded-md border'>
        <div className='text-center py-12 text-muted-foreground'>Заявки на партнерство не найдены</div>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Статус</TableHead>
            <TableHead>Имя</TableHead>
            <TableHead>Телефон</TableHead>
            <TableHead>Кол-во машин</TableHead>
            <TableHead>Пользователь</TableHead>
            <SortableHeader field='createdAt' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
              Создана
            </SortableHeader>
            <TableHead className='w-[130px]'>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map(form => (
            <TableRow key={form.id} className='hover:bg-muted/50'>
              <TableCell>{statusBadge(form.status)}</TableCell>
              <TableCell>
                <span className='text-sm font-medium'>{form.name || '—'}</span>
              </TableCell>
              <TableCell>
                <span className='text-sm'>{form.phone || '—'}</span>
              </TableCell>
              <TableCell>
                {form.carsCount !== null ? (
                  <span className='text-sm'>{form.carsCount}</span>
                ) : (
                  <span className='text-muted-foreground'>—</span>
                )}
              </TableCell>
              <TableCell>
                <div className='flex flex-col gap-0.5'>
                  {form.user?.fullName && (
                    <span className='text-sm font-medium'>{form.user.fullName}</span>
                  )}
                  {form.user?.email && (
                    <span className='text-xs text-muted-foreground'>{form.user.email}</span>
                  )}
                  {!form.user?.fullName && !form.user?.email && (
                    <span className='text-muted-foreground'>—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(form.createdAt)}</TableCell>
              <TableCell onClick={e => e.stopPropagation()}>
                <ActionCell form={form} handleUpdateStatus={handleUpdateStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
