'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, SquareDashedBottom, MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/data-display/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import type { LocationGroupDTO } from '@shared/api/location-groups';
import { KYRGYZSTAN_REGIONS } from '@shared/constants/kyrgyzstan-regions';

interface AreasTableContentProps {
  areas: LocationGroupDTO[];
  onDeleteArea: (area: LocationGroupDTO) => void;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
  handleSort?: (field: string) => void;
}

function SortableHeader({
  field,
  sortBy,
  sortOrder,
  onSort,
  children,
}: {
  field: string;
  sortBy?: string;
  sortOrder?: 'Asc' | 'Desc';
  onSort?: (field: string) => void;
  children: React.ReactNode;
}) {
  const isActive = sortBy === field;
  return (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && (
          sortOrder === 'Asc'
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );
}

export function AreasTableContent({
  areas,
  onDeleteArea,
  sortBy,
  sortOrder,
  handleSort,
}: AreasTableContentProps) {
  const router = useRouter();

  if (areas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <SquareDashedBottom className="mx-auto h-8 w-8 mb-2 opacity-40" />
        <p>Области не найдены</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
              Название
            </SortableHeader>
            <SortableHeader field="city" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
              Город
            </SortableHeader>
            <TableHead>Точек</TableHead>
            <TableHead>Координаты центра</TableHead>
            <TableHead className="w-[80px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {areas.map(area => (
            <TableRow key={area.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{area.name}</TableCell>
              <TableCell>
                {KYRGYZSTAN_REGIONS[area.city as keyof typeof KYRGYZSTAN_REGIONS] || area.city || '—'}
              </TableCell>
              <TableCell>{Math.floor((area.poly?.length ?? 0) / 2)}</TableCell>
              <TableCell className="text-muted-foreground text-xs font-mono">
                {area.latitude?.toFixed(4) ?? '—'}, {area.longitude?.toFixed(4) ?? '—'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/areas/edit/${area.id}`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDeleteArea(area)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
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
