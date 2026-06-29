'use client';

import { ArrowUpDown, Edit, Trash2, MapPin, ChevronUp, ChevronDown, MoreHorizontal, Eye } from 'lucide-react';
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
import { useUserRole } from '@shared/contexts';
import type { LocationDTO } from '@entities/locations/interface/LocationDTO';
import { LocationType, LocationTypeLabels, locationTypeIcons } from '@entities/locations/enums';
import { Role } from '@entities/users/enums';

interface ColumnVisibility {
  type: boolean;
  name: boolean;
  address: boolean;
  district: boolean;
  country: boolean;
  region: boolean;
  coordinates: boolean;
  isActive: boolean;
  popular1: boolean;
  actions: boolean;
}

interface LocationsTableContentProps {
  paginatedLocations: LocationDTO[];
  columnVisibility: ColumnVisibility;
  router: AppRouterInstance;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  onDeleteLocation: (location: LocationDTO) => void;
}

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

export function LocationsTableContent({
  paginatedLocations,
  columnVisibility,
  router,
  sortBy,
  sortOrder,
  handleSort,
  onDeleteLocation,
}: LocationsTableContentProps) {
  const { userRole } = useUserRole();

  // Проверяем, может ли пользователь редактировать и удалять локации (все роли кроме Operator)
  const canEditLocations = userRole !== Role.Operator;
  const canDeleteLocations = userRole !== Role.Operator;

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (paginatedLocations.length === 0) {
    return;
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {columnVisibility.type && <SortableHeader field='type' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Тип</SortableHeader>}
            {columnVisibility.name && <SortableHeader field='name' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Название</SortableHeader>}
            {columnVisibility.address && <SortableHeader field='address' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Адрес</SortableHeader>}
            {columnVisibility.district && <SortableHeader field='district' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Район</SortableHeader>}
            {columnVisibility.country && <SortableHeader field='country' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Страна</SortableHeader>}
            {columnVisibility.region && <SortableHeader field='region' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Регион</SortableHeader>}
            {columnVisibility.coordinates && <TableHead>Координаты</TableHead>}
            {columnVisibility.isActive && <SortableHeader field='isActive' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Активна</SortableHeader>}
            {columnVisibility.popular1 && <SortableHeader field='popular1' sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Топ точки</SortableHeader>}
            {columnVisibility.actions && <TableHead className='w-[100px]'>Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedLocations.map((location) => (
            <TableRow key={location.id} className='hover:bg-muted/50'>
              {columnVisibility.type && (
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg'>{locationTypeIcons[location.type]}</span>
                    <span className='text-sm'>{LocationTypeLabels[location.type]}</span>
                  </div>
                </TableCell>
              )}
              {columnVisibility.name && (
                <TableCell className='font-medium'>{location.name}</TableCell>
              )}
              {columnVisibility.address && (
                <TableCell className='max-w-xs truncate' title={location.address}>
                  {location.address}
                </TableCell>
              )}
              {columnVisibility.district && (
                <TableCell>{location.district || '—'}</TableCell>
              )}
              {columnVisibility.country && (
                <TableCell>{location.country}</TableCell>
              )}
              {columnVisibility.region && (
                <TableCell>{location.region}</TableCell>
              )}
              {columnVisibility.coordinates && (
                <TableCell>
                  <div className='flex items-center gap-1 text-sm font-mono'>
                    <MapPin className='h-3 w-3 text-muted-foreground' />
                    <span title={formatCoordinates(location.latitude, location.longitude)}>
                      {formatCoordinates(location.latitude, location.longitude)}
                    </span>
                  </div>
                </TableCell>
              )}
              {columnVisibility.isActive && (
                <TableCell>
                  <Badge className={location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {location.isActive ? 'Активна' : 'Неактивна'}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.popular1 && (
                <TableCell>
                  <Badge variant={location.popular1 ? 'default' : 'outline'}>
                    {location.popular1 ? 'Да' : 'Нет'}
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
                      <DropdownMenuItem onClick={() => router.push(`/locations/view?id=${location.id}`)}>
                        <Eye className='mr-2 h-4 w-4' />
                        Просмотр
                      </DropdownMenuItem>
                      {canEditLocations && (
                        <DropdownMenuItem onClick={() => router.push(`/locations/edit/${location.id}`)}>
                          <Edit className='mr-2 h-4 w-4' />
                          Редактировать
                        </DropdownMenuItem>
                      )}
                      {canDeleteLocations && (
                        <DropdownMenuItem
                          className='text-red-600'
                          onClick={() => onDeleteLocation(location)}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Удалить
                        </DropdownMenuItem>
                      )}
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
