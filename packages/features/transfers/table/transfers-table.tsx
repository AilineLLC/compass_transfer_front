'use client';

import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import { TransfersTableContent, TransfersTableFilters } from './components';
import { useTransfersTable } from './hooks/use-transfers-table';

export function TransfersTable() {
  const {
    transfers,
    pendingReservationsMap,
    loading,
    error,
    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,
    sortBy,
    sortOrder,
    columnVisibility,
    hasPending,
    isHot,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleSort,
    handleColumnVisibilityChange,
    handleHasPendingChange,
    handleIsHotChange,
    loadTransfers,
    refetch,
    router,
  } = useTransfersTable();

  if (error) {
    return (
      <DataTableErrorState
        error={error}
        onRetry={loadTransfers}
        entityName='трансферов'
      />
    );
  }

  return (
    <div className='space-y-4'>
      <TransfersTableFilters
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
        columnVisibility={columnVisibility}
        handleColumnVisibilityChange={handleColumnVisibilityChange}
        onRefresh={refetch}
        isLoading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        hasPending={hasPending}
        isHot={isHot}
        onHasPendingChange={handleHasPendingChange}
        onIsHotChange={handleIsHotChange}
      />

      <TransfersTableContent
        transfers={transfers}
        pendingReservationsMap={pendingReservationsMap}
        columnVisibility={columnVisibility}
        router={router}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        onRefetch={refetch}
      />

      {loading && (
        <div className='text-center py-4'>
          <p>Загрузка трансферов...</p>
        </div>
      )}

      <DataTablePagination
        currentItems={transfers}
        totalCount={totalCount}
        pageSize={pageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        currentPageNumber={currentPageNumber}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        handleFirstPage={handleFirstPage}
        itemName='трансферов'
      />
    </div>
  );
}
