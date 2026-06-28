'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@shared/ui/forms/input';

interface AreasTableFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  pageSize: number;
  handlePageSizeChange: (size: number) => void;
}

export function AreasTableFilters({
  searchTerm,
  setSearchTerm,
  cityFilter,
  setCityFilter,
  pageSize,
  handlePageSizeChange,
}: AreasTableFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <Input
        placeholder="Фильтр по городу..."
        value={cityFilter}
        onChange={e => setCityFilter(e.target.value)}
        className="w-48"
      />
      <select
        value={pageSize}
        onChange={e => handlePageSizeChange(Number(e.target.value))}
        className="border border-input rounded-md px-3 py-2 text-sm bg-background"
      >
        <option value={10}>10 / стр</option>
        <option value={20}>20 / стр</option>
        <option value={50}>50 / стр</option>
      </select>
    </div>
  );
}
