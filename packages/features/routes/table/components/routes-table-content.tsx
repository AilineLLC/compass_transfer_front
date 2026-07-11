'use client';

import { ChevronUp, ChevronDown, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Button } from '@shared/ui/forms/button';
import { Badge } from '@shared/ui/data-display/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/data-display/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import type { RouteDTO } from '@entities/routes/interface/PartnerRouteDTO';

interface ColumnVisibility {
  name: boolean;
  startLocation: boolean;
  endLocation: boolean;
  price: boolean;
  duration: boolean;
  isPopular: boolean;
  actions: boolean;
}

interface RoutesTableContentProps {
  paginatedRoutes: RouteDTO[];
  columnVisibility: ColumnVisibility;
  router: AppRouterInstance;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  onDeleteRoute: (route: RouteDTO) => void;
}

function SortableHeader({ field, sortBy, sortOrder, onSort, children }: {
  field: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  children: React.ReactNode;
}) {
  return (
    <TableHead
      className='cursor-pointer hover:bg-muted/50 select-none'
      onClick={() => onSort(field)}
    >
      <div className='flex items-center gap-1'>
        {children}
        {sortBy === field && (
          sortOrder === 'asc'
            ? <ChevronUp className='h-4 w-4' />
            : <ChevronDown className='h-4 w-4' />
        )}
      </div>
    </TableHead>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

export function RoutesTableContent({
  paginatedRoutes,
  columnVisibility,
  router,
  sortBy,
  sortOrder,
  handleSort,
  onDeleteRoute,
}: RoutesTableContentProps) {
  if (paginatedRoutes.length === 0) return null;

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {columnVisibility.name && (
              <SortableHeader field='name' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                Название
              </SortableHeader>
            )}
            {columnVisibility.startLocation && <TableHead>Точка А</TableHead>}
            {columnVisibility.endLocation && <TableHead>Точка Б</TableHead>}
            {columnVisibility.price && (
              <SortableHeader field='price' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                Цена
              </SortableHeader>
            )}
            {columnVisibility.duration && (
              <SortableHeader field='duration' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                Длительность
              </SortableHeader>
            )}
            {columnVisibility.isPopular && <TableHead>Популярное</TableHead>}
            {columnVisibility.actions && <TableHead className='w-[80px]'>Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRoutes.map(route => (
            <TableRow key={route.id} className='hover:bg-muted/50'>
              {columnVisibility.name && (
                <TableCell className='font-medium'>{route.name}</TableCell>
              )}
              {columnVisibility.startLocation && (
                <TableCell>{route.startLocation?.name ?? route.startLocationId}</TableCell>
              )}
              {columnVisibility.endLocation && (
                <TableCell>{route.endLocation?.name ?? route.endLocationId}</TableCell>
              )}
              {columnVisibility.price && (
                <TableCell>
                  {route.prices?.length
                    ? route.prices.map(p => p.price.toLocaleString('ru-RU')).join(' / ') + ' сом'
                    : '—'}
                </TableCell>
              )}
              {columnVisibility.duration && (
                <TableCell>{route.duration != null ? formatDuration(route.duration) : '—'}</TableCell>
              )}
              {columnVisibility.isPopular && (
                <TableCell>
                  <Badge variant={route.isPopular ? 'default' : 'outline'}>
                    {route.isPopular ? 'Да' : 'Нет'}
                  </Badge>
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
                      <DropdownMenuItem onClick={() => router.push(`/routes/edit/${route.id}`)}>
                        <Edit className='mr-2 h-4 w-4' />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='text-red-600'
                        onClick={() => onDeleteRoute(route)}
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
  );
}
