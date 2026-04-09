'use client';

import { ChevronUp, ChevronDown, MoreHorizontal, Eye, Check, X, Trash2 } from 'lucide-react';
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
import { Badge } from '@shared/ui/data-display/badge';
import { Button } from '@shared/ui/forms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { DeleteConfirmationModal } from '@shared/ui/modals';
import {
  transferReservationsApi,
  type TransferReservationDTO,
} from '@shared/api/transfer-reservations';
import { toast } from 'sonner';

interface ColumnVisibility {
  status: boolean;
  customer: boolean;
  phone: boolean;
  reservedSeats: boolean;
  transfer: boolean;
  createdAt: boolean;
  actions: boolean;
}

interface TransferReservationsTableContentProps {
  reservations: TransferReservationDTO[];
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    Pending:   { label: 'Ожидает',    variant: 'outline',     className: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
    Approved:  { label: 'Одобрена',   variant: 'default',     className: 'bg-green-600 text-white border-green-600' },
    Rejected:  { label: 'Отклонена',  variant: 'destructive' },
    Cancelled: { label: 'Отменена',   variant: 'secondary' },
  };
  const cfg = map[status] ?? { label: status, variant: 'secondary' as const };
  return (
    <Badge variant={cfg.variant} className={`text-xs ${cfg.className ?? ''}`}>
      {cfg.label}
    </Badge>
  );
}

export function TransferReservationsTableContent({
  reservations,
  columnVisibility,
  router,
  sortBy,
  sortOrder,
  handleSort,
  onRefetch,
}: TransferReservationsTableContentProps) {
  const [reservationToDelete, setReservationToDelete] = useState<TransferReservationDTO | null>(null);

  const handleDelete = async () => {
    await transferReservationsApi.deleteReservation(reservationToDelete!.id);
    toast.success('Заявка удалена');
    setReservationToDelete(null);
    onRefetch?.();
  };

  const handleApprove = async (reservation: TransferReservationDTO) => {
    try {
      await transferReservationsApi.approveReservation(reservation.id);
      toast.success('Заявка одобрена');
      onRefetch?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка при одобрении');
    }
  };

  const handleReject = async (reservation: TransferReservationDTO) => {
    try {
      await transferReservationsApi.rejectReservation(reservation.id);
      toast.success('Заявка отклонена');
      onRefetch?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка при отклонении');
    }
  };

  if (reservations.length === 0) {
    return (
      <div className='rounded-md border'>
        <div className='text-center py-12 text-muted-foreground'>Заявки не найдены</div>
      </div>
    );
  }

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              {columnVisibility.status && (
                <SortableHeader field='status' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                  Статус
                </SortableHeader>
              )}
              {columnVisibility.customer && <TableHead>Клиент</TableHead>}
              {columnVisibility.phone && <TableHead>Телефон</TableHead>}
              {columnVisibility.reservedSeats && <TableHead>Мест</TableHead>}
              {columnVisibility.transfer && <TableHead>Трансфер</TableHead>}
              {columnVisibility.createdAt && (
                <SortableHeader field='createdAt' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                  Создана
                </SortableHeader>
              )}
              {columnVisibility.actions && <TableHead className='w-[50px]'>Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map(reservation => (
              <TableRow key={reservation.id} className='hover:bg-muted/50'>
                {columnVisibility.status && (
                  <TableCell>
                    <StatusBadge status={reservation.status} />
                  </TableCell>
                )}
                {columnVisibility.customer && (
                  <TableCell className='font-medium'>{reservation.name || reservation.customer?.fullName || '—'}</TableCell>
                )}
                {columnVisibility.phone && (
                  <TableCell className='text-muted-foreground'>{reservation.phone || reservation.customer?.phoneNumber || '—'}</TableCell>
                )}
                {columnVisibility.reservedSeats && (
                  <TableCell>{reservation.reservedSeats}</TableCell>
                )}
                {columnVisibility.transfer && (
                  <TableCell>
                    <button
                      className='font-mono text-xs text-primary hover:underline'
                      onClick={() => router.push(`/transfers/${reservation.transfer}`)}
                    >
                      {reservation.transfer.slice(0, 8)}…
                    </button>
                  </TableCell>
                )}
                {columnVisibility.createdAt && (
                  <TableCell className='text-muted-foreground'>{formatDate(reservation.createdAt)}</TableCell>
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
                        <DropdownMenuItem onClick={() => router.push(`/transfers/${reservation.transfer}`)}>
                          <Eye className='mr-2 h-4 w-4' />
                          Открыть трансфер
                        </DropdownMenuItem>
                        {reservation.status === 'Pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleApprove(reservation)}
                              className='text-green-600 focus:text-green-600'
                            >
                              <Check className='mr-2 h-4 w-4' />
                              Одобрить
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReject(reservation)}
                              className='text-red-500 focus:text-red-500'
                            >
                              <X className='mr-2 h-4 w-4' />
                              Отклонить
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setReservationToDelete(reservation)}
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
        isOpen={reservationToDelete !== null}
        onClose={() => setReservationToDelete(null)}
        onConfirm={handleDelete}
        title='Удалить заявку?'
        description={
          reservationToDelete
            ? `Заявка от «${reservationToDelete.name}» будет удалена безвозвратно.`
            : ''
        }
      />
    </>
  );
}
