'use client';

import { DataTablePagination, DataTableErrorState } from '@shared/ui/data-table';
import { DeleteConfirmationModal } from '@shared/ui/modals';
import { useDeleteLocation } from '@features/locations/hooks';
import { LocationsTableFilters, LocationsTableContent } from './components';
import { useLocationsTable } from './hooks/use-locations-table';

export function LocationsTable({
  initialFilters,
}: {
  initialFilters?: {
    type?: string;
    city?: string;
    region?: string;
    isActive?: string;
    popular1?: string;
  };
}) {
  const {
    filteredLocations: _filteredLocations,
    paginatedLocations,
    loading,
    error,
    searchTerm,
    nameFilter,
    addressFilter,
    districtFilter,
    cityFilter,
    countryFilter,
    regionFilter,
    typeFilter,
    isActiveFilter,
    popular1Filter,
    showAdvancedFilters,
    currentPageNumber,
    pageSize,
    columnVisibility,
    totalCount,
    hasNext,
    hasPrevious,
    sortBy,
    sortOrder,
    setSearchTerm,
    setNameFilter,
    setAddressFilter,
    setDistrictFilter,
    setCityFilter,
    setCountryFilter,
    setRegionFilter,
    setIsActiveFilter,
    setPopular1Filter,
    isLandingOnlyFilter,
    setIsLandingOnlyFilter,
    setShowAdvancedFilters,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    handleTypeFilterChange,
    handleSort,
    loadLocations,
    router,
    saveFilters,
    clearSavedFilters,
    hasSavedFilters,
    justSavedFilters,
    handleIsActiveFilterChange,
  } = useLocationsTable(initialFilters);

  // Хук для удаления локаций
  const {
    isModalOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    getDeleteModalProps,
  } = useDeleteLocation({
    onSuccess: loadLocations, // Перезагружаем список после удаления
  });

  if (error) {
    return (
      <DataTableErrorState 
        error={error} 
        onRetry={loadLocations} 
        entityName="локаций" 
      />
    );
  }

  return (
    <div className='space-y-4'>
      <LocationsTableFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        nameFilter={nameFilter}
        setNameFilter={setNameFilter}
        addressFilter={addressFilter}
        setAddressFilter={setAddressFilter}
        districtFilter={districtFilter}
        setDistrictFilter={setDistrictFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        countryFilter={countryFilter}
        setCountryFilter={setCountryFilter}
        regionFilter={regionFilter}
        setRegionFilter={setRegionFilter}
        typeFilter={typeFilter}
        handleTypeFilterChange={handleTypeFilterChange}
        isActiveFilter={isActiveFilter}
        setIsActiveFilter={setIsActiveFilter}
        handleIsActiveFilterChange={handleIsActiveFilterChange}
        popular1Filter={popular1Filter}
        setPopular1Filter={setPopular1Filter}
        isLandingOnlyFilter={isLandingOnlyFilter}
        setIsLandingOnlyFilter={setIsLandingOnlyFilter}
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

      <LocationsTableContent
        paginatedLocations={paginatedLocations}
        columnVisibility={columnVisibility}
        router={router}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        onDeleteLocation={openDeleteModal}
      />

      {loading && (
        <div className='text-center py-4'>
          <p>Загрузка локаций...</p>
        </div>
      )}

      <DataTablePagination
        currentItems={paginatedLocations}
        totalCount={totalCount}
        pageSize={pageSize}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        currentPageNumber={currentPageNumber}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        handleFirstPage={handleFirstPage}
        itemName="локаций"
      />

      {/* Модальное окно удаления */}
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        {...getDeleteModalProps()}
      />
    </div>
  );
}
