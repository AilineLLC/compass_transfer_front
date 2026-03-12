'use client';

import { Edit, Trash2, Archive, ArchiveRestore, Clock, Car, ChevronUp, ChevronDown, MoreHorizontal, Eye } from 'lucide-react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { GetTariffDTOWithArchived } from '@shared/api/tariffs';
import { Badge } from '@shared/ui/data-display/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/data-display/table';
import { Button } from '@shared/ui/forms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { useUserRole } from '@shared/contexts';
import { getServiceClassLabel } from '@entities/users/utils/service-class-utils';
import { Role } from '@entities/users/enums';

interface ColumnVisibility {
  name: boolean;
  serviceClass: boolean;
  carType: boolean;
  basePrice: boolean;
  minutePrice: boolean;
  minimumPrice: boolean;
  perKmPrice: boolean;
  freeWaitingTimeMinutes: boolean;
  archived: boolean;
  actions: boolean;
}

interface TariffsTableContentProps {
  paginatedTariffs: GetTariffDTOWithArchived[];
  columnVisibility: ColumnVisibility;
  router: AppRouterInstance;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  onDeleteTariff: (tariff: GetTariffDTOWithArchived) => void;
  onToggleArchive: (tariff: GetTariffDTOWithArchived) => void;
  isArchiving: boolean;
}

// Переводы для типов автомобилей
const carTypeLabels: Record<string, string> = {
  'Sedan': 'Седан',
  'Hatchback': 'Хэтчбек',
  'SUV': 'Внедорожник',
  'Minivan': 'Минивэн',
  'Coupe': 'Купе',
  'Cargo': 'Грузовой',
  'Pickup': 'Пикап',
};

// Компонент для сортируемых заголовков
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
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && (
          sortOrder === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );
}

export function TariffsTableContent({
  paginatedTariffs,
  columnVisibility,
  router,
  sortBy,
  sortOrder,
  handleSort,
  onDeleteTariff,
  onToggleArchive,
  isArchiving,
}: TariffsTableContentProps) {
  const { userRole } = useUserRole();

  // Проверяем, может ли пользователь редактировать и архивировать тарифы (все роли кроме Operator)
  const canEditTariffs = userRole !== Role.Operator;
  const canArchiveTariffs = userRole !== Role.Operator;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KGS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (paginatedTariffs.length === 0) {
    return;
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {columnVisibility.name && <SortableHeader field='name' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Название</SortableHeader>}
            {columnVisibility.serviceClass && <SortableHeader field='serviceClass' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Класс</SortableHeader>}
            {columnVisibility.carType && <SortableHeader field='carType' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Тип авто</SortableHeader>}
            {columnVisibility.basePrice && <SortableHeader field='basePrice' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Базовая цена</SortableHeader>}
            {columnVisibility.minutePrice && <SortableHeader field='minutePrice' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>За минуту</SortableHeader>}
            {columnVisibility.minimumPrice && <SortableHeader field='minimumPrice' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Минимум</SortableHeader>}
            {columnVisibility.perKmPrice && <SortableHeader field='perKmPrice' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>За км</SortableHeader>}
            {columnVisibility.freeWaitingTimeMinutes && <SortableHeader field='freeWaitingTimeMinutes' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Ожидание</SortableHeader>}
            {columnVisibility.archived && <SortableHeader field='archived' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Статус</SortableHeader>}
            {columnVisibility.actions && <TableHead className='w-[120px]'>Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTariffs.map((tariff) => (
            <TableRow key={tariff.id} className={`hover:bg-muted/50 ${tariff.archived ? 'opacity-60' : ''}`}>
              {columnVisibility.name && (
                <TableCell className='font-medium'>{tariff.name}</TableCell>
              )}
              {columnVisibility.serviceClass && (
                <TableCell>
                  <Badge variant='outline' className='font-medium'>
                    {getServiceClassLabel(tariff.serviceClass)}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.carType && (
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Car className='h-4 w-4 text-muted-foreground' />
                    <span>{carTypeLabels[tariff.carType] || tariff.carType}</span>
                  </div>
                </TableCell>
              )}
              {columnVisibility.basePrice && (
                <TableCell>
                  <div className='font-mono font-semibold'>
                    {formatPrice(tariff.basePrice)}
                  </div>
                </TableCell>
              )}
              {columnVisibility.minutePrice && (
                <TableCell>
                  <div className='font-mono'>
                    {formatPrice(tariff.minutePrice)}
                  </div>
                </TableCell>
              )}
              {columnVisibility.minimumPrice && (
                <TableCell>
                  <div className='font-mono'>
                    {formatPrice(tariff.minimumPrice)}
                  </div>
                </TableCell>
              )}
              {columnVisibility.perKmPrice && (
                <TableCell>
                  <div className='font-mono'>
                    {formatPrice(tariff.perKmPrice)}
                  </div>
                </TableCell>
              )}
              {columnVisibility.freeWaitingTimeMinutes && (
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span>{tariff.freeWaitingTimeMinutes} мин</span>
                  </div>
                </TableCell>
              )}
              {columnVisibility.archived && (
                <TableCell>
                  <Badge className={tariff.archived ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
                    {tariff.archived ? 'Архивный' : 'Активный'}
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
                      <DropdownMenuItem onClick={() => router.push(`/tariffs/${tariff.id}`)}>
                        <Eye className='mr-2 h-4 w-4' />
                        Просмотр
                      </DropdownMenuItem>
                      {canEditTariffs && (
                        <DropdownMenuItem onClick={() => router.push(`/tariffs/edit/${tariff.id}`)}>
                          <Edit className='mr-2 h-4 w-4' />
                          Редактировать
                        </DropdownMenuItem>
                      )}
                      {canArchiveTariffs && (
                        <DropdownMenuItem
                          onClick={() => onToggleArchive(tariff)}
                          disabled={isArchiving}
                        >
                          {tariff.archived ? <ArchiveRestore className='mr-2 h-4 w-4' /> : <Archive className='mr-2 h-4 w-4' />}
                          {tariff.archived ? 'Разархивировать' : 'Архивировать'}
                        </DropdownMenuItem>
                      )}
                      {/* {canEditTariffs && (
                        <DropdownMenuItem
                          className='text-red-600'
                          onClick={() => onDeleteTariff(tariff)}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Удалить
                        </DropdownMenuItem>
                      )} */}
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
