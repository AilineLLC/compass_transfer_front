'use client';

import { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { usersApi } from '@shared/api/users';
import type { GetPassengerDTO } from '@entities/orders/interface';
import { CAR_TYPE_CAPACITY, CarTypeValues, type CarType } from '@entities/tariffs/enums/CarType.enum';
import type { GetTariffDTO } from '@entities/tariffs/interface';
import type { GetCustomerDTO, GetPartnerDTO } from '@entities/users/interface';

// Union тип для пользователей в поиске (Customer или Partner)
type SearchableUser = GetCustomerDTO | GetPartnerDTO;

// Расширенный пассажир с загруженными данными пользователя
export interface EnhancedPassenger extends GetPassengerDTO {
  userData?: SearchableUser | null; // Загруженные данные пользователя
  isUserDataLoaded?: boolean; // Флаг загрузки данных пользователя
  // Дополнительные поля для UI
  phone?: string;
  email?: string;
  age?: number;
  isFromSystem?: boolean;
}

interface UsePassengersManagementParams {
  users: SearchableUser[];
  initialPassengers?: EnhancedPassenger[];
  selectedTariff?: GetTariffDTO;
  isInstantOrder?: boolean;
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';
  onPassengersChange?: (passengers: EnhancedPassenger[]) => void;
  onValidationError?: () => void;
}

interface UsePassengersManagementResult {
  // Состояние пассажиров
  passengers: EnhancedPassenger[];
  selectedCustomer: SearchableUser | null;
  isLoadingPassengerData: boolean;
  passengersDataLoaded: boolean;

  // Поиск пользователей
  searchQuery: string;
  searchResults: SearchableUser[];
  isSearching: boolean;
  filteredUsers: SearchableUser[];

  // Ограничения
  maxPassengers: number;
  canAddMorePassengers: boolean;

  // Действия с пассажирами
  addPassenger: () => void;
  removePassenger: (id: string) => void;
  updatePassenger: (id: string, field: keyof EnhancedPassenger, value: string | number | boolean) => void;
  setMainPassenger: (id: string) => void;
  fillFromCustomer: (customerId: string) => void;

  // Действия с поиском
  setSearchQuery: (query: string) => void;
  setSelectedCustomer: (customer: SearchableUser | null) => void;

  // Утилиты
  getCarTypeLabel: (carType: CarType) => string;
  handleViewUserProfile: (user: SearchableUser, event: React.MouseEvent) => void;
}

export function usePassengersManagement({
  users,
  initialPassengers,
  selectedTariff,
  isInstantOrder = false,
  userRole = 'operator',
  onPassengersChange,
  onValidationError: _onValidationError,
}: UsePassengersManagementParams): UsePassengersManagementResult {
  const [passengers, setPassengers] = useState<EnhancedPassenger[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SearchableUser | null>(null);
  const [isLoadingPassengerData, setIsLoadingPassengerData] = useState(false);
  const [passengersDataLoaded, setPassengersDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Разрешенные роли для выбора пассажиров
  const allowedRoles = useMemo(() => ['Customer', 'Partner'], []);

  // Определяем максимальное количество пассажиров на основе выбранного тарифа
  const maxPassengers = useMemo(() => {
    if (!selectedTariff?.carType) return 4; // По умолчанию 4 места (седан)
    
    return CAR_TYPE_CAPACITY[selectedTariff.carType as CarType] || 4;
  }, [selectedTariff]);

  // Проверяем, можно ли добавить еще пассажиров
  const canAddMorePassengers = passengers.length < maxPassengers;

  // Функция для загрузки данных пользователя по ID
  const loadUserData = useCallback(async (userId: string): Promise<SearchableUser | null> => {
    // Партнеры не могут загружать данные других пользователей
    if (userRole === 'partner') {
      return null;
    }

    try {
      const response = await usersApi.getUserById(userId);

      return response;
    } catch {
      return null;
    }
  }, [userRole]);

  // Функция для обновления пассажиров с уведомлением родителя
  const updatePassengersList = useCallback((newPassengers: EnhancedPassenger[]) => {
    setPassengers(newPassengers);
    if (onPassengersChange) {
      onPassengersChange(newPassengers);
    }
  }, [onPassengersChange]);

  // useLayoutEffect для синхронной загрузки данных пассажиров
  useLayoutEffect(() => {
    const loadPassengersData = async () => {
      if (!initialPassengers || initialPassengers.length === 0) {
        // Для моментальных заказов автоматически создаем пассажира по умолчанию
        if (isInstantOrder) {
          const defaultPassenger: EnhancedPassenger = {
            id: `passenger-${Date.now()}`,
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            isMainPassenger: true,
            isFromSystem: false,
            customerId: null,
            userData: null,
            isUserDataLoaded: true
          };

          setPassengers([defaultPassenger]);

          // Уведомляем родительский компонент о создании пассажира
          if (onPassengersChange) {
            onPassengersChange([defaultPassenger]);
          }
        }

        setPassengersDataLoaded(true);

        return;
      }

      setIsLoadingPassengerData(true);

      const enhancedPassengers: EnhancedPassenger[] = [];

      for (const passenger of initialPassengers) {
        const enhancedPassenger: EnhancedPassenger = {
          ...passenger,
          userData: null,
          isUserDataLoaded: false
        };

        // Если у пассажира есть ID, это ID пользователя в системе - загружаем данные
        if (passenger.id) {
          const userData = await loadUserData(passenger.id);

          enhancedPassenger.userData = userData;
          enhancedPassenger.isUserDataLoaded = true;
        } else {
          // Если нет ID, помечаем как загруженный
          enhancedPassenger.isUserDataLoaded = true;
        }

        enhancedPassengers.push(enhancedPassenger);
      }

      setPassengers(enhancedPassengers);
      setIsLoadingPassengerData(false);
      setPassengersDataLoaded(true);
    };

    if (!passengersDataLoaded) {
      loadPassengersData();
    }
  }, [initialPassengers, passengersDataLoaded, onPassengersChange, isInstantOrder, loadUserData]);

  // Синхронизируем состояние пассажиров с пропсами при возврате на таб
  useEffect(() => {
    if (initialPassengers && initialPassengers.length > 0) {
      setPassengers(initialPassengers);

      // Пытаемся восстановить выбранного клиента из пассажиров
      const passengerFromSystem = initialPassengers.find(p => p.isFromSystem && p.email);

      if (passengerFromSystem && !selectedCustomer) {
        const customer = users.find(u => u.email === passengerFromSystem.email);

        if (customer) {
          setSelectedCustomer(customer);
        }
      }
    }
  }, [initialPassengers, users, selectedCustomer]);

  // Функция поиска пользователей через API
  const searchUsers = useCallback(
    async (query: string) => {
      // Партнеры не могут искать пользователей
      if (userRole === 'partner') {
        setSearchResults([]);

        return;
      }

      if (!query.trim()) {
        setSearchResults([]);

        return;
      }

      try {
        setIsSearching(true);

        // Создаем параметры с множественными ролями
        const params = {
          fullName: query,
          fullNameOp: 'Contains' as const,
          size: 50,
          first: true,
          role: allowedRoles.join(',') // Преобразуем массив в строку через запятую
        };

        const response = await usersApi.getUsers(params);

        setSearchResults(response.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [allowedRoles, userRole],
  );

  // Debounced поиск
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Логика отображения пользователей
  const filteredUsers = useMemo(() => {
    // Партнеры не могут видеть список пользователей
    if (userRole === 'partner') {
      return [];
    }

    // Если есть поисковый запрос, показываем только результаты поиска
    if (searchQuery.trim()) {
      return searchResults.filter(user => allowedRoles.includes(user.role));
    }

    // Если поиска нет, показываем изначальных пользователей
    return (users || []).filter(user => allowedRoles.includes(user.role));
  }, [userRole, searchQuery, searchResults, allowedRoles, users]);

  const addPassenger = useCallback(() => {
    if (!canAddMorePassengers) return;

    const newPassenger: EnhancedPassenger = {
      id: Date.now().toString(),
      firstName: 'Имя не указано',
      lastName: '',
      phone: '',
      email: '',
      isMainPassenger: passengers.length === 0,
      isFromSystem: false, // Пассажир создан вручную - редактируемый
      userData: null,
      isUserDataLoaded: true,
    };

    updatePassengersList([...passengers, newPassenger]);
  }, [canAddMorePassengers, passengers, updatePassengersList]);

  const removePassenger = useCallback((id: string) => {
    const updatedPassengers = passengers.filter(p => p.id !== id);

    // Если удаляем основного пассажира, делаем основным первого из оставшихся
    const removedPassenger = passengers.find(p => p.id === id);

    if (removedPassenger?.isMainPassenger && updatedPassengers.length > 0) {
      updatedPassengers[0].isMainPassenger = true;
    }

    updatePassengersList(updatedPassengers);
  }, [passengers, updatePassengersList]);

  const updatePassenger = useCallback((
    id: string,
    field: keyof EnhancedPassenger,
    value: string | number | boolean,
  ) => {
    updatePassengersList(passengers.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  }, [passengers, updatePassengersList]);

  const setMainPassenger = useCallback((id: string) => {
    updatePassengersList(
      passengers.map(p => ({
        ...p,
        isMainPassenger: p.id === id,
      })),
    );
  }, [passengers, updatePassengersList]);

  const fillFromCustomer = useCallback((customerId: string) => {
    if (!canAddMorePassengers) return;

    const customer = filteredUsers.find(u => u.id === customerId);

    if (customer) {
      // Создаем нового пассажира на основе данных клиента
      const newPassenger: EnhancedPassenger = {
        id: Date.now().toString(),
        firstName: customer.fullName || 'Имя не указано',
        lastName: '',
        phone: customer.phoneNumber || '',
        email: customer.email || '',
        isMainPassenger: passengers.length === 0, // Первый пассажир становится основным
        isFromSystem: true, // Помечаем как пассажира из системы
        customerId: customer.id, // Сохраняем ID пользователя
        userData: customer, // Сохраняем данные пользователя
        isUserDataLoaded: true, // Данные уже загружены
      };

      updatePassengersList([...passengers, newPassenger]);
    }
  }, [canAddMorePassengers, filteredUsers, passengers, updatePassengersList]);

  // Получаем русское название типа автомобиля
  const getCarTypeLabel = useCallback((carType: CarType): string => {
    return CarTypeValues[carType] || carType;
  }, []);

  // Функция для перехода к профилю пользователя
  const handleViewUserProfile = useCallback((user: SearchableUser, event: React.MouseEvent) => {
    event.stopPropagation(); // Предотвращаем выбор пользователя при клике на иконку
    const roleMap: Record<string, string> = {
      'Customer': 'customer',
      'Partner': 'partner',
      'Admin': 'admin',
      'Driver': 'driver',
      'Operator': 'operator',
      'Terminal': 'terminal'
    };

    const rolePath = roleMap[user.role] || user.role.toLowerCase();
    const profileUrl = `/users/${rolePath}/${user.id}`;

    window.open(profileUrl, '_blank');
  }, []);

  return {
    // Состояние пассажиров
    passengers,
    selectedCustomer,
    isLoadingPassengerData,
    passengersDataLoaded,

    // Поиск пользователей
    searchQuery,
    searchResults,
    isSearching,
    filteredUsers,

    // Ограничения
    maxPassengers,
    canAddMorePassengers,

    // Действия с пассажирами
    addPassenger,
    removePassenger,
    updatePassenger,
    setMainPassenger,
    fillFromCustomer,

    // Действия с поиском
    setSearchQuery,
    setSelectedCustomer,

    // Утилиты
    getCarTypeLabel,
    handleViewUserProfile,
  };
}
