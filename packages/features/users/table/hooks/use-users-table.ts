'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { usersApi } from '@shared/api/users';
import {
  UserRole,
  type UserRoleType,
  type UserApi,
} from '@entities/users';

export function useUsersTable(_initialRoleFilter?: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState<'Asc' | 'Desc'>('Asc');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [emailFilter, setEmailFilter] = useState(() => searchParams.get('email') || '');
  const [phoneFilter, setPhoneFilter] = useState(() => searchParams.get('phone') || '');

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Получаем роль из URL параметров
  const roleFromUrl = searchParams.get('role');
  const [roleFilter, setRoleFilter] = useState<UserRoleType | 'all'>(() => {
    if (roleFromUrl && Object.values(UserRole).includes(roleFromUrl as UserRoleType)) {
      return roleFromUrl as UserRoleType;
    }

    return 'all';
  });

  const [onlineFilter, setOnlineFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Пагинация (cursor-based с историей для кнопки "Назад")
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [cursorsHistory, setCursorsHistory] = useState<(string | null)[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Инициализируем pageSize из localStorage синхронно
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPageSize = localStorage.getItem('users-page-size');

      if (savedPageSize) {
        const parsedSize = parseInt(savedPageSize, 10);

        if (!isNaN(parsedSize) && parsedSize > 0) {
          return parsedSize;
        }
      }
    }
    
    return 5; // значение по умолчанию
  });

  // Инициализируем columnVisibility из localStorage синхронно
  const [columnVisibility, setColumnVisibility] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('users-column-visibility');

      if (saved) {
        try {
          return JSON.parse(saved);

        } catch {
          // Fallback если JSON поврежден - используем значения по умолчанию
        }
      }
    }

    return {
      user: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      actions: true,
    };
  });

  // Функция загрузки пользователей
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Создаем параметры поиска (cursor-based)
      const params: Record<string, string | number | boolean | undefined> = {
        role: roleFilter === 'all' ? undefined : roleFilter,
        size: pageSize,
        sortBy,
        sortOrder,
      };

      // Добавляем cursor-based параметры
      if (isFirstPage) {
        params.first = true;
      } else if (currentCursor) {
        params.after = currentCursor;
      }

      // Добавляем поиск по имени (основной поиск)
      if (searchTerm) {
        params.fullName = searchTerm;
        params.fullNameOp = 'Contains';
      }

      // Добавляем фильтр по email
      if (emailFilter) {
        params.email = emailFilter;
        params.emailOp = 'Contains';
      }

      // Добавляем фильтр по телефону
      if (phoneFilter) {
        params.phoneNumber = phoneFilter;
        params.phoneNumberOp = 'Contains';
      }

      const response = await usersApi.getUsers(params);

      setUsers(response.data);

      // Обновляем информацию о пагинации
      setTotalCount(response.totalCount || response.data.length);
      setTotalPages(Math.ceil((response.totalCount || response.data.length) / pageSize));

      // Определяем hasNext и hasPrevious на основе данных
      const hasNextPage = response.hasNext !== undefined ? response.hasNext : response.data.length === pageSize;
      const hasPrevPage = response.hasPrevious !== undefined ? response.hasPrevious : currentPageNumber > 1;



      setHasNext(hasNextPage);
      setHasPrevious(hasPrevPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки пользователей';

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchTerm, emailFilter, phoneFilter, currentPageNumber, isFirstPage, currentCursor, pageSize, sortBy, sortOrder]);

  // Клиентская фильтрация только для онлайн статуса (если нужно)
  const filteredUsers = users.filter(user => {
    const matchesOnline =
      onlineFilter === 'all' ||
      (onlineFilter === 'online' && user.online) ||
      (onlineFilter === 'offline' && !user.online);

    return matchesOnline;
  });

  // Данные уже приходят с сервера с пагинацией
  const paginatedUsers = filteredUsers;

  // Обработчики пагинации (cursor-based с историей)
  const handleNextPage = () => {
    if (hasNext && users.length > 0) {
      const lastUser = users[users.length - 1];

      // Сохраняем текущий cursor в историю
      setCursorsHistory(prev => [...prev, currentCursor]);
      setCurrentCursor(lastUser.id);
      setIsFirstPage(false);
      setCurrentPageNumber(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (cursorsHistory.length > 0) {
      // Берем предыдущий cursor из истории
      const newHistory = [...cursorsHistory];
      const prevCursor = newHistory.pop();

      setCursorsHistory(newHistory);
      setCurrentCursor(prevCursor || null);
      setIsFirstPage(prevCursor === null);
      setCurrentPageNumber(prev => prev - 1);
    }
  };

  const handleFirstPage = () => {
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  const handlePageChange = (page: number) => {
    if (page === 1) {
      handleFirstPage();
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);

    if (typeof window !== 'undefined') {
      localStorage.setItem('users-page-size', newPageSize.toString());
    }
  };

  const handleColumnVisibilityChange = (column: string, visible: boolean) => {
    const newVisibility = { ...columnVisibility, [column]: visible };

    setColumnVisibility(newVisibility);

    if (typeof window !== 'undefined') {
      localStorage.setItem('users-column-visibility', JSON.stringify(newVisibility));
    }
  };

  // Обработка изменений фильтра роли с обновлением URL
  const handleRoleFilterChange = (value: UserRoleType | 'all') => {
    setRoleFilter(value);
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);

    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all') {
      params.delete('role');
    } else {
      params.set('role', value);
    }

    router.push(`/users?${params.toString()}`);
  };

  // Обработчик сортировки
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Если кликнули по тому же полю, меняем направление
      setSortOrder(sortOrder === 'Asc' ? 'Desc' : 'Asc');
    } else {
      // Если кликнули по новому полю, устанавливаем его и направление по возрастанию
      setSortBy(field);
      setSortOrder('Asc');
    }

    // Сбрасываем пагинацию при изменении сортировки
    setCursorsHistory([]);
    setCurrentCursor(null);
    setIsFirstPage(true);
    setCurrentPageNumber(1);
  };

  // Синхронизация фильтров с URL параметрами
  useEffect(() => {
    const currentRoleFromUrl = searchParams.get('role');
    if (
      currentRoleFromUrl &&
      Object.values(UserRole).includes(currentRoleFromUrl as UserRoleType)
    ) {
      setRoleFilter(currentRoleFromUrl as UserRoleType);
    } else if (!currentRoleFromUrl) {
      setRoleFilter('all');
    }

    const currentSearch = searchParams.get('search') || '';
    if (currentSearch !== searchTerm) setSearchTerm(currentSearch);

    const currentEmail = searchParams.get('email') || '';
    if (currentEmail !== emailFilter) setEmailFilter(currentEmail);

    const currentPhone = searchParams.get('phone') || '';
    if (currentPhone !== phoneFilter) setPhoneFilter(currentPhone);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps



  // Загрузка пользователей при изменении фильтров
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    // Data
    users,
    filteredUsers,
    paginatedUsers,

    // State
    loading,
    error,
    searchTerm,
    emailFilter,
    phoneFilter,
    roleFilter,
    onlineFilter,
    showAdvancedFilters,
    // Пагинация
    currentCursor,
    isFirstPage,
    currentPageNumber,
    currentPage: currentPageNumber, // Для совместимости
    pageSize,
    columnVisibility,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,
    sortBy,
    sortOrder,

    // Handlers
    setSearchTerm: (term: string) => {
      setSearchTerm(term);
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) params.set('search', term); else params.delete('search');
        router.replace(params.toString() ? `/users?${params.toString()}` : '/users');
      }, 500);
    },
    setEmailFilter: (email: string) => {
      setEmailFilter(email);
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
      emailDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (email) params.set('email', email); else params.delete('email');
        router.replace(params.toString() ? `/users?${params.toString()}` : '/users');
      }, 500);
    },
    setPhoneFilter: (phone: string) => {
      setPhoneFilter(phone);
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);

      if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
      phoneDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (phone) params.set('phone', phone); else params.delete('phone');
        router.replace(params.toString() ? `/users?${params.toString()}` : '/users');
      }, 500);
    },
    setOnlineFilter: (filter: 'all' | 'online' | 'offline') => {
      setOnlineFilter(filter);
      setCursorsHistory([]);
      setCurrentCursor(null);
      setIsFirstPage(true);
      setCurrentPageNumber(1);
    },
    setShowAdvancedFilters,
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handlePageSizeChange,
    handleColumnVisibilityChange,
    handleRoleFilterChange,
    handleSort,
    loadUsers,

    // Router
    router,
  };
}
