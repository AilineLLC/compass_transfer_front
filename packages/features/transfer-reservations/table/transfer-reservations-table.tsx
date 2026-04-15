'use client';

import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import { TransferReservationsTableContent, TransferReservationsTableFilters } from './components';
import { useTransferReservationsTable } from './hooks/use-transfer-reservations-table';

export function TransferReservationsTable() {
  const {
    reservations,
    loading,
    error,
    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,
    statusFilter,
    sortBy,
    sortOrder,
    columnVisibility,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleSort,
    handleStatusFilterChange,
    handleColumnVisibilityChange,
    loadReservations,
    refetch,
    router,
  } = useTransferReservationsTable();

  if (error) {
    return (
      <DataTableErrorState
        error={error}
        onRetry={loadReservations}
        entityName='заявок'
      />
    );
  }

  return (
    <div className='space-y-4'>
      <TransferReservationsTableFilters
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
        statusFilter={statusFilter}
        handleStatusFilterChange={handleStatusFilterChange}
        columnVisibility={columnVisibility}
        handleColumnVisibilityChange={handleColumnVisibilityChange}
        onRefresh={refetch}
        isLoading={loading}
      />

      <TransferReservationsTableContent
        reservations={reservations}
        columnVisibility={columnVisibility}
        router={router}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        onRefetch={refetch}
      />

      {loading && (
        <div className='text-center py-4'>
          <p>Загрузка заявок...</p>
        </div>
      )}

      <DataTablePagination
        currentItems={reservations}
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
