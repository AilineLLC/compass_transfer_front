'use client';

import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import { DeleteConfirmationModal } from '@shared/ui/modals';
import { useDeleteRoute } from '@features/routes/hooks/use-delete-route';
import { RoutesTableFilters, RoutesTableContent } from './components';
import { useRoutesTable } from './hooks/use-routes-table';

export function RoutesTable() {
  const {
    paginatedRoutes,
    loading,
    error,
    searchTerm,
    isPopularFilter,
    currentPageNumber,
    pageSize,
    totalCount,
    hasNext,
    hasPrevious,
    sortBy,
    sortOrder,
    columnVisibility,
    setSearchTerm,
    setIsPopularFilter,
    handleSort,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    loadData,
    router,
  } = useRoutesTable();

  const {
    isModalOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    getDeleteModalProps,
  } = useDeleteRoute({ onSuccess: loadData });

  if (error) {
    return (
      <DataTableErrorState
        error={error}
        onRetry={loadData}
        entityName='направлений'
      />
    );
  }

  return (
    <div className='space-y-4'>
      <RoutesTableFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isPopularFilter={isPopularFilter}
        setIsPopularFilter={setIsPopularFilter}
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
        columnVisibility={columnVisibility}
        handleColumnVisibilityChange={handleColumnVisibilityChange}
      />

      <RoutesTableContent
        paginatedRoutes={paginatedRoutes}
        columnVisibility={columnVisibility}
        router={router}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        onDeleteRoute={openDeleteModal}
      />

      {loading && (
        <div className='text-center py-4'>
          <p>Загрузка направлений...</p>
        </div>
      )}

      <DataTablePagination
        currentItems={paginatedRoutes}
        totalCount={totalCount}
        pageSize={pageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        currentPageNumber={currentPageNumber}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        handleFirstPage={handleFirstPage}
        itemName='направлений'
      />

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        {...getDeleteModalProps()}
      />
    </div>
  );
}
