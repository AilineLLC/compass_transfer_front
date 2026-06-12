'use client';

import { ChevronUp, ChevronDown, MoreHorizontal, Eye, Edit, Trash2, ClipboardList } from 'lucide-react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { Badge } from '@shared/ui/data-display/badge';
import { DeleteConfirmationModal } from '@shared/ui/modals';
import { transfersApi, type GetTransferDTO } from '@shared/api/transfers';

interface ColumnVisibility {
  departureTime: boolean;
  startLocation: boolean;
  endLocation: boolean;
  price: boolean;
  distance: boolean;
  reservations: boolean;
  passengers: boolean;
  freeSeats: boolean;
  driver: boolean;
  car: boolean;
  actions: boolean;
}

interface TransfersTableContentProps {
  transfers: GetTransferDTO[];
  pendingReservationsMap: Record<string, number>;
  columnVisibility: ColumnVisibility;
  router: AppRouterInstance;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  onRefetch?: () => void;
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

export function TransfersTableContent({
  transfers,
  pendingReservationsMap,
  columnVisibility,
  router,
  sortBy,
  sortOrder,
  handleSort,
  onRefetch,
}: TransfersTableContentProps) {
  const [transferToDelete, setTransferToDelete] = useState<GetTransferDTO | null>(null);

  const handleDelete = async () => {
    await transfersApi.deleteTransfer(transferToDelete!.id);
    setTransferToDelete(null);
    onRefetch?.();
  };

  if (transfers.length === 0) {
    return (
      <div className='rounded-md border'>
        <div className='text-center py-12 text-muted-foreground'>Трансферы не найдены</div>
      </div>
    );
  }

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              {columnVisibility.departureTime && (
                <SortableHeader
                  field='departureTime'
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Время отправления
                </SortableHeader>
              )}
              {columnVisibility.startLocation && <TableHead>Откуда</TableHead>}
              {columnVisibility.endLocation && <TableHead>Куда</TableHead>}
              {columnVisibility.price && (
                <SortableHeader
                  field='price'
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Цена
                </SortableHeader>
              )}
              {columnVisibility.distance && (
                <SortableHeader
                  field='distance'
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Расстояние
                </SortableHeader>
              )}
              {columnVisibility.reservations && <TableHead>Заявки</TableHead>}
              {columnVisibility.passengers && <TableHead>Пассажиры</TableHead>}
              {columnVisibility.freeSeats && <TableHead>Свободных мест</TableHead>}
              {columnVisibility.driver && <TableHead>Водитель</TableHead>}
              {columnVisibility.car && <TableHead>Автомобиль</TableHead>}
              {columnVisibility.actions && <TableHead className='w-[50px]'>Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map(transfer => (
              <TableRow key={transfer.id} className='hover:bg-muted/50'>
                {columnVisibility.departureTime && (
                  <TableCell className='font-medium'>
                    {formatDate(transfer.departureTime)}
                  </TableCell>
                )}
                {columnVisibility.startLocation && (
                  <TableCell
                    className='max-w-[160px] truncate'
                    title={transfer.startLocation?.name || '—'}
                  >
                    {transfer.startLocation?.name || '—'}
                  </TableCell>
                )}
                {columnVisibility.endLocation && (
                  <TableCell
                    className='max-w-[160px] truncate'
                    title={transfer.endLocation?.name || '—'}
                  >
                    {transfer.endLocation?.name || '—'}
                  </TableCell>
                )}
                {columnVisibility.price && (
                  <TableCell>{transfer.price.toLocaleString('ru-RU')} сом</TableCell>
                )}
                {columnVisibility.distance && (
                  <TableCell>{transfer.distance != null ? `${transfer.distance} км` : '—'}</TableCell>
                )}
                {columnVisibility.reservations && (
                  <TableCell>
                    {(pendingReservationsMap[transfer.id] ?? 0) > 0 ? (
                      <button
                        type='button'
                        onClick={() => router.push(`/transfers/${transfer.id}`)}
                        className='inline-flex'
                      >
                        <Badge className='gap-1 cursor-pointer bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300'>
                          <ClipboardList className='h-3 w-3' />
                          {pendingReservationsMap[transfer.id]}
                        </Badge>
                      </button>
                    ) : (
                      <span className='text-muted-foreground text-sm'>—</span>
                    )}
                  </TableCell>
                )}
                {columnVisibility.passengers && (
                  <TableCell>{transfer.passengers.length}</TableCell>
                )}
                {columnVisibility.freeSeats && (
                  <TableCell>{transfer.freeSeats}</TableCell>
                )}
                {columnVisibility.driver && (
                  <TableCell>{transfer.driver?.fullName || '—'}</TableCell>
                )}
                {columnVisibility.car && (
                  <TableCell>
                    {transfer.car
                      ? `${transfer.car.make} ${transfer.car.model} · ${transfer.car.licensePlate}`
                      : '—'}
                  </TableCell>
                )}
                {columnVisibility.actions && (
                  <TableCell>
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
                        <DropdownMenuItem
                          onClick={() => router.push(`/transfers/${transfer.id}`)}
                        >
                          <Eye className='mr-2 h-4 w-4' />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/transfers/${transfer.id}/edit`)}
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTransferToDelete(transfer)}
                          className='text-destructive focus:text-destructive'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmationModal
        isOpen={transferToDelete !== null}
        onClose={() => setTransferToDelete(null)}
        onConfirm={handleDelete}
        title='Удалить трансфер?'
        description='Трансфер и все связанные данные будут удалены безвозвратно.'
      />
    </>
  );
}
