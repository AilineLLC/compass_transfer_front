'use client';

import { DataTablePagination, DataTableErrorState, DataTableLoader } from '@shared/ui/data-table';
import { DeleteConfirmationModal } from '@shared/ui/modals';
import { useDeleteArea } from '@features/areas/hooks';
import { AreasTableFilters, AreasTableContent } from './components';
import { useAreasTable } from './hooks/use-areas-table';

export function AreasTable() {
  const {
    areas, loading, error, totalCount, hasNext, hasPrevious,
    currentPageNumber, pageSize, searchTerm, cityFilter, sortBy, sortOrder,
    setSearchTerm, setCityFilter,
    handleNextPage, handlePrevPage, handleFirstPage, handlePageSizeChange, handleSort,
    loadAreas,
  } = useAreasTable();

  const { isModalOpen, openDeleteModal, closeDeleteModal, confirmDelete, getDeleteModalProps } =
    useDeleteArea({ onSuccess: loadAreas });

  if (error) {
    return <DataTableErrorState error={error} onRetry={loadAreas} entityName="областей" />;
  }

  return (
    <div className="space-y-4">
      <AreasTableFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
      />

      <DataTableLoader loading={loading} entityName="областей">
        <AreasTableContent
          areas={areas}
          onDeleteArea={openDeleteModal}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSort={handleSort}
        />
        <DataTablePagination
          currentItems={areas}
          totalCount={totalCount}
          pageSize={pageSize}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          currentPageNumber={currentPageNumber}
          handleNextPage={handleNextPage}
          handlePrevPage={handlePrevPage}
          handleFirstPage={handleFirstPage}
          itemName="областей"
        />
      </DataTableLoader>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        {...getDeleteModalProps()}
      />
    </div>
  );
}
