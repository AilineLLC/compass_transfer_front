'use client';

import { useRouter } from 'next/navigation';
import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import { PaymentsTableContent, PaymentsTableFilters } from './components';
import { usePaymentsTable } from './hooks/use-payments-table';

export function PaymentsTable() {
  const router = useRouter();
  const {
    payments,
    loading,
    error,
    typeFilter,
    gatewayFilter,
    statusFilter,
    pageSize,
    columnVisibility,
    totalCount,
    hasNext,
    hasPrevious,
    currentPageNumber,
    sortBy,
    sortOrder,
    setTypeFilter,
    setGatewayFilter,
    setStatusFilter,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    handleSortChange,
    refetch,
  } = usePaymentsTable();

  const handleViewDetails = (paymentId: string) => {
    router.push(`/payments/${paymentId}`);
  };

  if (error) {
    return <DataTableErrorState error={error} onRetry={refetch} entityName="платежей" />;
  }

  return (
    <div className="space-y-4">
      {/* Фильтры и поиск */}
      <PaymentsTableFilters
        typeFilter={typeFilter}
        gatewayFilter={gatewayFilter}
        statusFilter={statusFilter}
        setTypeFilter={setTypeFilter}
        setGatewayFilter={setGatewayFilter}
        setStatusFilter={setStatusFilter}
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
        columnVisibility={columnVisibility}
        handleColumnVisibilityChange={handleColumnVisibilityChange}
        onRefresh={refetch}
      />

      {/* Таблица */}
      <PaymentsTableContent
        payments={payments}
        loading={loading}
        columnVisibility={columnVisibility}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onViewDetails={handleViewDetails}
      />

      {/* Пагинация */}
      <DataTablePagination
        currentItems={payments}
        totalCount={totalCount}
        pageSize={pageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        currentPageNumber={currentPageNumber}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        handleFirstPage={handleFirstPage}
        itemName="платежей"
      />
    </div>
  );
}
