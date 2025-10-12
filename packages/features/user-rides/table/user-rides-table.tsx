'use client';

import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import { OrderType } from '@entities/orders/enums/OrderType.enum';
import { getOrderViewRoute } from '@entities/orders/utils/order-routes';
import { UserRidesTableFilters, UserRidesTableContent } from './components';
import { useUserRidesTable } from './hooks/use-user-rides-table';

interface UserRidesTableProps {
  userId: string;
}

export function UserRidesTable({
  initialFilters,
  userId,
}: {
  initialFilters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
} & UserRidesTableProps) {
  const {
    paginatedRides,
    loading,
    error,
    searchTerm,
    statusFilter,
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
    setShowAdvancedFilters,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    handleStatusFilterChange,
    handleSortChange,
    refetch,
  } = useUserRidesTable(initialFilters, userId);

  const handleViewDetails = (rideId: string) => {
    // Найдем поездку по ID, чтобы получить orderId и тип заказа
    const ride = paginatedRides.find(r => r.id === rideId);
    
    if (ride && ride.orderId && ride.order?.type) {
      // Используем реальный тип заказа из order
      const route = getOrderViewRoute(ride.orderId, ride.order.type);

      window.open(route, '_blank');
    } else if (ride && ride.orderId) {
      // Fallback - если нет типа, используем Instant
      const route = getOrderViewRoute(ride.orderId, OrderType.Instant);

      window.open(route, '_blank');
    } else {
      // Fallback - переходим к поездке (пока не реализовано)
      window.open(`/rides/${rideId}`, '_blank');
    }
  };

  if (error) {
    return (
      <DataTableErrorState 
        error={error} 
        onRetry={refetch} 
        entityName="поездок" 
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Фильтры и поиск */}
      <UserRidesTableFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        handleStatusFilterChange={handleStatusFilterChange}
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        columnVisibility={columnVisibility}
        handleColumnVisibilityChange={handleColumnVisibilityChange}
        _totalCount={totalCount}
        onRefresh={refetch}
      />

      {/* Таблица */}
      <UserRidesTableContent
        rides={paginatedRides}
        loading={loading}
        columnVisibility={columnVisibility}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onViewDetails={handleViewDetails}
      />

      {/* Пагинация */}
      <DataTablePagination
        currentItems={paginatedRides}
        totalCount={totalCount}
        pageSize={pageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        currentPageNumber={currentPageNumber}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        handleFirstPage={handleFirstPage}
        itemName="поездок пользователя"
      />
    </div>
  );
}
