'use client';

import { RotateCw } from 'lucide-react';
import { Button } from '@shared/ui/forms/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/forms/select';
import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import type { CustomerOrderFormStatus } from '@shared/api/customer-order-forms';
import { CustomerOrderFormsTableContent } from './components';
import { useCustomerOrderFormsTable } from './hooks/use-customer-order-forms-table';

const STATUS_OPTIONS: { value: CustomerOrderFormStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все статусы' },
  { value: 'Pending', label: 'Ожидают' },
  { value: 'Verified', label: 'Принятые' },
  { value: 'Rejected', label: 'Отклонённые' },
];

interface CustomerOrderFormsTableProps {
  initialStatus?: CustomerOrderFormStatus;
}

export function CustomerOrderFormsTable({ initialStatus }: CustomerOrderFormsTableProps) {
  const {
    forms,
    loading,
    error,
    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,
    sortBy,
    sortOrder,
    statusFilter,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleSort,
    handleStatusFilterChange,
    loadForms,
    refetch,
    router,
  } = useCustomerOrderFormsTable(initialStatus);

  if (error) {
    return (
      <DataTableErrorState
        error={error}
        onRetry={loadForms}
        entityName='заявок'
      />
    );
  }

  return (
    <div className='space-y-4'>
      {/* Фильтры */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between overflow-x-auto py-2'>
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
          <Select
            value={pageSize.toString()}
            onValueChange={value => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className='w-full md:w-32'>
              <SelectValue placeholder='Размер' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='10'>10</SelectItem>
              <SelectItem value='25'>25</SelectItem>
              <SelectItem value='50'>50</SelectItem>
              <SelectItem value='100'>100</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter ?? 'all'}
            onValueChange={value =>
              handleStatusFilterChange(
                value === 'all' ? undefined : (value as CustomerOrderFormStatus),
              )
            }
          >
            <SelectTrigger className='w-full md:w-44'>
              <SelectValue placeholder='Статус' />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant='outline'
          className='w-full md:w-auto text-blue-600 border-blue-200 hover:bg-blue-50'
          onClick={refetch}
          disabled={loading}
        >
          <RotateCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      <CustomerOrderFormsTableContent
        forms={forms}
        router={router}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
      />

      {loading && (
        <div className='text-center py-4'>
          <p>Загрузка заявок...</p>
        </div>
      )}

      <DataTablePagination
        currentItems={forms}
        totalCount={totalCount}
        pageSize={pageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        currentPageNumber={currentPageNumber}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        handleFirstPage={handleFirstPage}
        itemName='заявок'
      />
    </div>
  );
}
