'use client';

import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import { OrdersTableFilters, OrdersTableContent } from './components';
import { useOrdersTable } from './hooks/use-orders-table';

export function OrdersTable({
  initialFilters,
}: {
  initialFilters?: {
    orderNumber?: string;
    type?: string;
    status?: string;
    subStatus?: string;
    airFlight?: string;
    flyReis?: string;
  };
}) {
  const {
    paginatedOrders,
    loading,
    error,
    searchTerm,
    typeFilter,
    statusFilter,
    subStatusFilter,
    airFlightInput,
    flyReisInput,
    showAdvancedFilters,
    pageSize,
    columnVisibility,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,
    sortBy,
    sortOrder,
    setSearchTerm,
    setAirFlightInput,
    setFlyReisInput,
    setShowAdvancedFilters,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    handleTypeFilterChange,
    handleStatusFilterChange,
    handleSubStatusFilterChange,
    handleSort,
    loadOrders,
    router,
    saveFilters,
    clearSavedFilters,
    hasSavedFilters,
    justSavedFilters,
    refetch,
  } = useOrdersTable(initialFilters);

  if (error) {
    return (
      <DataTableErrorState 
        error={error} 
        onRetry={loadOrders} 
        entityName="заказов" 
      />
    );
  }

  return (
    <div className='space-y-4'>
      <OrdersTableFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        typeFilter={typeFilter}
        handleTypeFilterChange={handleTypeFilterChange}
        statusFilter={statusFilter}
        handleStatusFilterChange={handleStatusFilterChange}
        subStatusFilter={subStatusFilter}
        handleSubStatusFilterChange={handleSubStatusFilterChange}
        airFlightInput={airFlightInput}
        setAirFlightInput={setAirFlightInput}
        flyReisInput={flyReisInput}
        setFlyReisInput={setFlyReisInput}
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        columnVisibility={columnVisibility}
        handleColumnVisibilityChange={handleColumnVisibilityChange}
        onSaveFilters={saveFilters}
        onClearSavedFilters={clearSavedFilters}
        hasSavedFilters={hasSavedFilters}
        justSavedFilters={justSavedFilters}
      />

      <OrdersTableContent
        paginatedOrders={paginatedOrders}
        columnVisibility={columnVisibility}
        router={router}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        onRefetch={refetch}
      />

      {loading && (
        <div className='text-center py-4'>
          <p>Загрузка заказов...</p>
        </div>
      )}

      <DataTablePagination
        currentItems={paginatedOrders}
        totalCount={totalCount}
        pageSize={pageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        currentPageNumber={currentPageNumber}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        handleFirstPage={handleFirstPage}
        itemName="заказов"
      />
    </div>
  );
}
