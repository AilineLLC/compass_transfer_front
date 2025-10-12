'use client';

import { DataTablePagination, DataTableErrorState, DataTableLoader } from '@shared/ui/data-table';
import { DeleteConfirmationModal } from '@shared/ui/modals';
import { useDeleteNotification, useNotificationActions } from '@features/notifications/hooks';
import { NotificationsTableFilters, NotificationsTableContent } from './components';
import { useNotificationsTable } from './hooks/use-notifications-table';

export function NotificationsTable({
  initialFilters,
}: {
  initialFilters?: {
    type?: string;
    isRead?: string;
    orderType?: string;
    userId?: string;
  };
}) {
  const {
    filteredNotifications: _filteredNotifications,
    paginatedNotifications,
    loading,
    error,
    searchTerm,
    contentFilter,
    typeFilter,
    orderTypeFilter,
    isReadFilter,
    userIdFilter,
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
    setContentFilter,
    setIsReadFilter,
    setUserIdFilter,
    setShowAdvancedFilters,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    handleTypeFilterChange,
    handleOrderTypeFilterChange,
    handleSort,
    loadNotifications,
    router,
    showMyNotifications,
    toggleMyNotifications,
    saveFilters,
    clearSavedFilters,
    hasSavedFilters,
    justSavedFilters,
  } = useNotificationsTable(initialFilters);

  // Хук для удаления уведомлений
  const {
    isModalOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    getDeleteModalProps,
  } = useDeleteNotification({
    onSuccess: loadNotifications, // Перезагружаем список после удаления
  });

  // Хук для действий с уведомлениями
  const {
    toggleReadStatus,
    isUpdating,
  } = useNotificationActions({
    onSuccess: loadNotifications, // Перезагружаем список после изменения статуса
  });

  // Обработчик для показа моих уведомлений
  const handleShowMyNotifications = () => {
    toggleMyNotifications();
  };

  if (error) {
    return (
      <DataTableErrorState 
        error={error} 
        onRetry={loadNotifications} 
        entityName="уведомлений" 
      />
    );
  }

  return (
    <div className='space-y-4'>
      <NotificationsTableFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        contentFilter={contentFilter}
        setContentFilter={setContentFilter}
        typeFilter={typeFilter}
        handleTypeFilterChange={handleTypeFilterChange}
        orderTypeFilter={orderTypeFilter}
        handleOrderTypeFilterChange={handleOrderTypeFilterChange}
        isReadFilter={isReadFilter}
        setIsReadFilter={setIsReadFilter}
        userIdFilter={userIdFilter}
        setUserIdFilter={setUserIdFilter}
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        columnVisibility={columnVisibility}
        handleColumnVisibilityChange={handleColumnVisibilityChange}
        onShowMyNotifications={handleShowMyNotifications}
        showMyNotifications={showMyNotifications}
        isUpdating={isUpdating}
        onSaveFilters={saveFilters}
        onClearSavedFilters={clearSavedFilters}
        hasSavedFilters={hasSavedFilters}
        justSavedFilters={justSavedFilters}
      />

      <DataTableLoader loading={loading} entityName="уведомлений">
        <NotificationsTableContent
          paginatedNotifications={paginatedNotifications}
          columnVisibility={columnVisibility}
          router={router}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSort={handleSort}
          onDeleteNotification={openDeleteModal}
          onToggleReadStatus={toggleReadStatus}
          isUpdating={isUpdating}
          showMyNotifications={showMyNotifications}
        />

        <DataTablePagination
          currentItems={paginatedNotifications}
          totalCount={totalCount}
          pageSize={pageSize}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          currentPageNumber={currentPageNumber}
          handleNextPage={handleNextPage}
          handlePrevPage={handlePrevPage}
          handleFirstPage={handleFirstPage}
          itemName="уведомлений"
        />
      </DataTableLoader>

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
