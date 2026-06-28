'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import apiClient from '@shared/api/client';
import { usersApi } from '@shared/api/users';
import type { MapBounds, RoutePoint } from '@shared/components/map/types';
import type { GetLocationDTO } from '@entities/locations/interface';
import type { GetRideDTO } from '@entities/orders/interface';
import type { GetDriverDTO } from '@entities/users/interface';
import { useActiveDrivers, type ActiveDriver } from '@features/drivers/hooks/useActiveDrivers';
import { useLocations } from '@features/locations/hooks/useLocations';

interface UseOrderLocationsParams {
  startLocationId?: string | null;
  endLocationId?: string | null;
  additionalStops?: string[];
  mode?: 'create' | 'edit';
  rides?: GetRideDTO[]; // Данные поездок для режима редактирования

  // Внешнее состояние для сохранения между табами
  externalRoutePoints?: RoutePoint[];
  setExternalRoutePoints?: (points: RoutePoint[]) => void;
  externalSelectedDriver?: GetDriverDTO | null;
  setExternalSelectedDriver?: (driver: GetDriverDTO | null) => void;
  externalDynamicMapCenter?: { latitude: number; longitude: number } | null;
  setExternalDynamicMapCenter?: (center: { latitude: number; longitude: number } | null) => void;
  externalOpenDriverPopupId?: string | null;
  setExternalOpenDriverPopupId?: (id: string | null) => void;

  scheduledTime?: string | null;
  completionTimeEstimate?: string | null;
  onRouteChange?: (routePoints: RoutePoint[]) => void;
  onRoutePointsChange?: (startId: string, endId: string, points: RoutePoint[]) => void;
}

interface UseOrderLocationsResult {
  // Данные маршрута
  routePoints: RoutePoint[];
  isReady: boolean;

  // Данные карты
  mapLocations: GetLocationDTO[];
  mapCenter: { latitude: number; longitude: number };
  dynamicMapCenter: { latitude: number; longitude: number } | null;

  // Данные водителей
  drivers: ActiveDriver[]; // Активные водители для карты
  allDrivers: GetDriverDTO[]; // Все водители для панели
  selectedDriver: GetDriverDTO | null;
  openDriverPopupId: string | null;

  // Состояния UI
  isModalOpen: boolean;
  modalTitle: string;
  selectedPointIndex: number | null;

  // Обработчики
  handlePointSelect: (index: number) => void;
  handleLocationSelect: (location: GetLocationDTO) => void;
  handlePointClear: (index: number) => void;
  handleReorderPoints: (fromIndex: number, toIndex: number) => void;
  handleMapBoundsChange: (bounds: MapBounds) => void;
  handleDriverSelect: (driver: GetDriverDTO | null, location?: { latitude: number; longitude: number }, fromSearchPanel?: boolean) => void;
  handleLocationToggle: (location: GetLocationDTO, isSelected: boolean) => void;
  canSelectLocation: (location: GetLocationDTO) => boolean;
  addIntermediatePoint: (location?: GetLocationDTO) => void;
  closeModal: () => void;

  // Функции для работы с данными водителей
  getDriverById: (id: string) => Record<string, unknown> | null;
  loadDriverData: (id: string) => Promise<void>;
}

/**
 * Хук для всей логики карты и маршрута заказа
 */
export const useOrderLocations = ({
  startLocationId,
  endLocationId,
  additionalStops = [],
  mode = 'create',
  rides,
  // Внешнее состояние
  externalRoutePoints,
  setExternalRoutePoints,
  externalSelectedDriver,
  setExternalSelectedDriver,
  externalDynamicMapCenter,
  setExternalDynamicMapCenter,
  externalOpenDriverPopupId,
  setExternalOpenDriverPopupId,
  scheduledTime,
  completionTimeEstimate,
  // Колбэки
  onRouteChange,
  onRoutePointsChange
}: UseOrderLocationsParams): UseOrderLocationsResult => {

  // Состояния
  const [mapLocations, setMapLocations] = useState<GetLocationDTO[]>([]);
  const [allDrivers, setAllDrivers] = useState<GetDriverDTO[]>([]); // Список всех водителей для панели
  const [driversDataCache, setDriversDataCache] = useState<Record<string, Record<string, unknown>>>({});
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  // Ref для отслеживания инициализации в режиме редактирования
  const isInitializedRef = useRef(false);

  // Используем внешнее состояние если передано, иначе локальное
  const [localRoutePoints, setLocalRoutePoints] = useState<RoutePoint[]>([
    {
      id: '1',
      location: null,
      type: 'start',
      label: 'Откуда',
      latitude: 0,
      longitude: 0,
      name: 'Откуда'
    },
    {
      id: '2',
      location: null,
      type: 'end',
      label: 'Куда',
      latitude: 0,
      longitude: 0,
      name: 'Куда'
    },
  ]);
  const [localSelectedDriver, setLocalSelectedDriver] = useState<GetDriverDTO | null>(null);
  const [localDynamicMapCenter, setLocalDynamicMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [localOpenDriverPopupId, setLocalOpenDriverPopupId] = useState<string | null>(null);

  // Определяем, какое состояние использовать
  const routePoints = externalRoutePoints ?? localRoutePoints;
  const setRoutePoints = setExternalRoutePoints ?? setLocalRoutePoints;
  const selectedDriver = externalSelectedDriver ?? localSelectedDriver;
  const setSelectedDriver = setExternalSelectedDriver ?? setLocalSelectedDriver;
  const dynamicMapCenter = externalDynamicMapCenter ?? localDynamicMapCenter;
  const setDynamicMapCenter = setExternalDynamicMapCenter ?? setLocalDynamicMapCenter;
  const openDriverPopupId = externalOpenDriverPopupId ?? localOpenDriverPopupId;
  const setOpenDriverPopupId = setExternalOpenDriverPopupId ?? setLocalOpenDriverPopupId;

  // Хуки для работы с локациями и водителями
  const { fetchAllLocations, fetchLocationById } = useLocations();
  const { drivers, updateMapBounds } = useActiveDrivers();

  // Инициализация водителей (без загрузки локаций)
  useEffect(() => {
    const initialBounds: MapBounds = {
      latFrom: 42.82,
      latTo: 42.98,
      longFrom: 74.45,
      longTo: 74.7,
    };

    updateMapBounds(initialBounds);
  }, [updateMapBounds]);

  // Загрузка ВСЕХ локаций для обоих режимов
  useEffect(() => {
    if (mode === 'edit' && (startLocationId || endLocationId || additionalStops?.length)) {
      fetchAllLocations().then(locations => {
        setMapLocations(locations);
      });
    } else if (mode === 'create') {
      fetchAllLocations().then(locations => {
        setMapLocations(locations);
      });
    }
  }, [mode, startLocationId, endLocationId, additionalStops, fetchAllLocations]);

  // Загрузка водителя в режиме редактирования
  useEffect(() => {
    const loadDriverInEditMode = async () => {
      if (mode === 'edit' && rides && rides.length > 0 && rides[0].driverId) {
        const driverId = rides[0].driverId;

        try {
          // Загружаем данные водителя
          const driverData = await usersApi.getDriver(driverId);

          if (driverData) {
            // Устанавливаем водителя как выбранного — всегда, независимо от координат
            setSelectedDriver(driverData);

            // Перемещаем карту к водителю только если есть координаты
            if (driverData.currentLocation) {
              const { latitude, longitude } = driverData.currentLocation;
              setDynamicMapCenter({ latitude, longitude });
              setOpenDriverPopupId(driverId);
            }
          }
        } catch {
          // Тихо обрабатываем ошибку - водитель может быть недоступен
        }
      }
    };

    loadDriverInEditMode();
  }, [mode, rides, setSelectedDriver, setDynamicMapCenter, setOpenDriverPopupId]);

  // Загрузка ВСЕХ водителей для панели
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await apiClient.get<{
          data: GetDriverDTO[];
          totalCount: number;
        }>('/User/Driver', {
          params: {
            First: true,
            Size: 1000,
            IsActive: true,
            ...(scheduledTime && { HasNoScheduledOrdersFrom: scheduledTime }),
            ...(completionTimeEstimate && { HasNoScheduledOrdersTo: completionTimeEstimate }),
          }
        });

        const drivers = Array.isArray(response.data?.data) ? response.data.data : [];

        setAllDrivers(drivers);
      } catch {
        setAllDrivers([]);
      }
    };

    fetchDrivers();
  }, [scheduledTime, completionTimeEstimate]);

  // Инициализируем точки маршрута ОДИН РАЗ при загрузке данных в режиме редактирования.
  // Используем fetchLocationById как основной путь — работает для любых локаций
  // (активных, неактивных, не попавших в общий список).
  // mapLocations используем как кэш: если локация там есть — не делаем лишний запрос.
  useEffect(() => {
    if (mode !== 'edit') return;
    if (isInitializedRef.current) return;
    if (!startLocationId && !endLocationId && !(additionalStops?.length)) return;

    // Если внешние точки уже содержат локации — помечаем как инициализированные и не перезаписываем
    if (
      externalRoutePoints &&
      externalRoutePoints.find(p => p.type === 'start')?.location &&
      externalRoutePoints.find(p => p.type === 'end')?.location
    ) {
      isInitializedRef.current = true;
      return;
    }

    let cancelled = false;
    const initialize = async () => {
      const newRoutePoints: RoutePoint[] = [
        {
          id: '1',
          location: null,
          type: 'start',
          label: 'Откуда',
          latitude: 0,
          longitude: 0,
          name: 'Откуда'
        },
        {
          id: '2',
          location: null,
          type: 'end',
          label: 'Куда',
          latitude: 0,
          longitude: 0,
          name: 'Куда'
        },
      ];

      // Вспомогательная функция: сначала ищем в кэше, иначе фетчим по ID
      const resolveLocation = async (id: string): Promise<GetLocationDTO | null> => {
        const cached = mapLocations.find(loc => loc.id === id);
        if (cached) return cached;
        return fetchLocationById(id);
      };

      // Загружаем начальную и конечную локации параллельно
      const [startLocation, endLocation] = await Promise.all([
        startLocationId ? resolveLocation(startLocationId) : null,
        endLocationId ? resolveLocation(endLocationId) : null,
      ]);

      if (startLocation) {
        newRoutePoints[0] = { ...newRoutePoints[0], location: startLocation };
      }
      if (endLocation) {
        newRoutePoints[1] = { ...newRoutePoints[1], location: endLocation };
      }

      // Загружаем промежуточные остановки
      if (additionalStops && additionalStops.length > 0) {
        const stopLocations = await Promise.all(
          additionalStops.map(stopId => resolveLocation(stopId))
        );

        stopLocations.forEach((stopLocation, index) => {
          if (stopLocation) {
            const intermediatePoint: RoutePoint = {
              id: `intermediate-${index}`,
              location: stopLocation,
              type: 'intermediate',
              label: `Остановка ${index + 1}`,
              latitude: stopLocation.latitude,
              longitude: stopLocation.longitude,
              name: stopLocation.name,
            };
            newRoutePoints.splice(newRoutePoints.length - 1, 0, intermediatePoint);
          }
        });
      }

      if (!cancelled) {
        setRoutePoints(newRoutePoints);
        isInitializedRef.current = true;
      }
    };

    initialize().catch(() => {
      // тихо игнорируем — компонент мог анмаунтиться
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, startLocationId, endLocationId, additionalStops, fetchLocationById]);
  // mapLocations намеренно не в зависимостях: используем актуальное значение через замыкание.
  // Инициализация срабатывает как только появляются ID локаций, не ожидая mapLocations.

  // Сбрасываем флаг инициализации только при смене режима
  useEffect(() => {
    if (mode !== 'edit') {
      isInitializedRef.current = false;
    }
  }, [mode]);

  // Синхронизируем изменения routePoints с родительским компонентом
  useEffect(() => {
    if (mode === 'edit' && onRoutePointsChange && routePoints.length > 0) {
      const startPoint = routePoints.find(p => p.type === 'start');
      const endPoint = routePoints.find(p => p.type === 'end');

      if (startPoint?.location && endPoint?.location) {
        onRoutePointsChange(startPoint.location.id, endPoint.location.id, routePoints);
      }
    }
  }, [mode, routePoints, onRoutePointsChange]);

  // Готовность определяется наличием локаций в режиме редактирования
  const isReady = useMemo(() => {
    if (mode === 'create') return true;
    if (mode === 'edit') {
      return (!startLocationId && !endLocationId && !additionalStops?.length) || mapLocations.length > 0;
    }

    return true;
  }, [mode, startLocationId, endLocationId, additionalStops, mapLocations.length]);

  // Центр карты
  const mapCenter = useMemo(() => {
    // Если установлен динамический центр (например, при выборе водителя), используем его
    if (dynamicMapCenter) {
      return dynamicMapCenter;
    }

    const routePointsWithLocation = routePoints.filter(point =>
      point.location &&
      typeof point.location.latitude === 'number' &&
      typeof point.location.longitude === 'number'
    );

    if (routePointsWithLocation.length > 0) {
      const firstPoint = routePointsWithLocation[0];
      
      return {
        latitude: firstPoint.location!.latitude,
        longitude: firstPoint.location!.longitude
      };
    }

    return { latitude: 42.9, longitude: 74.575 };
  }, [routePoints, dynamicMapCenter]);

  // Уведомляем родительский компонент об изменениях
  useEffect(() => {
    if (onRouteChange) {
      onRouteChange(routePoints);
    }

    if (onRoutePointsChange) {
      const startPoint = routePoints.find(p => p.type === 'start');
      const endPoint = routePoints.find(p => p.type === 'end');

      // Используем исходные ID, если локации еще не загружены
      const startId = startPoint?.location?.id || startLocationId || '';
      const endId = endPoint?.location?.id || endLocationId || '';

      onRoutePointsChange(startId, endId, routePoints);
    }
  }, [routePoints, onRouteChange, onRoutePointsChange, startLocationId, endLocationId]);

  // Обработчики
  const handleMapBoundsChange = useCallback(async (bounds: MapBounds) => {
    updateMapBounds(bounds);
  }, [updateMapBounds]);

  const handlePointSelect = useCallback((index: number) => {
    setSelectedPointIndex(index);
    setModalTitle(routePoints[index].label || 'Выберите локацию');
    setIsModalOpen(true);
  }, [routePoints]);

  const handleLocationSelect = useCallback((location: GetLocationDTO) => {
    if (selectedPointIndex !== null) {
      const updatedPoints = [...routePoints];
      const selectedPoint = { ...updatedPoints[selectedPointIndex] };
      
      // Обновляем локацию и берем координаты из выбранной локации
      selectedPoint.location = location;

      // Обновляем точку
      updatedPoints[selectedPointIndex] = selectedPoint;
      setRoutePoints(updatedPoints);
      setIsModalOpen(false);
    }
  }, [routePoints, selectedPointIndex, setRoutePoints]);

  const handlePointClear = useCallback((index: number) => {
    const updatedPoints = [...routePoints];
    const clearedPoint = { ...updatedPoints[index], location: null };

    updatedPoints[index] = clearedPoint;
    setRoutePoints(updatedPoints);
  }, [routePoints, setRoutePoints]);

  const handleReorderPoints = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...routePoints];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    // Пересчитываем метки промежуточных точек по их новому порядку
    let intermediateCounter = 0;
    const renumbered = updated.map(p => {
      if (p.type !== 'intermediate') return p;
      intermediateCounter += 1;
      return { ...p, label: `Остановка ${intermediateCounter}` };
    });
    setRoutePoints(renumbered);
  }, [routePoints, setRoutePoints]);

  const canSelectLocation = useCallback((location: GetLocationDTO): boolean => {
    // Проверка, выбрана ли уже локация в какой-то точке маршрута
    return !routePoints.some(point => point.location?.id === location.id);
  }, [routePoints]);

  const addIntermediatePoint = useCallback((location?: GetLocationDTO) => {
    const newPoints = [...routePoints];
    const endPoint = newPoints.pop(); // Временно удаляем конечную точку
    
    if (!endPoint) {
      return; // На случай если в массиве нет точек (не должно происходить)
    }

    // Создаем новую промежуточную точку
    const newIntermediateIndex = newPoints.filter(p => p.type === 'intermediate').length + 1;
    
    // Если локация передана, создаем безопасную копию без циклических ссылок
    const safeLocation = location ? {
      id: location.id,
      name: location.name,
      address: location.address,
      type: location.type,
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.country,
      region: location.region,
      isActive: location.isActive,
      district: location.district,
      popular1: location.popular1,
      popular2: location.popular2,
    } : null;
    
    // Создаем новую точку - всегда null для локации, если не передана
    const newPoint: RoutePoint = {
      id: `intermediate-${Date.now()}`, // Уникальный ID
      type: 'intermediate',
      label: `Остановка ${newIntermediateIndex}`,
      location: location ? safeLocation : null, // Только если локация передана
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      name: location?.name || `Остановка ${newIntermediateIndex}`
    };

    // Добавляем промежуточную точку перед конечной
    newPoints.push(newPoint);
    newPoints.push(endPoint); // Возвращаем конечную точку
    
    setRoutePoints(newPoints);

    // Если локация не передана, открываем диалог выбора
    if (!location) {
      setTimeout(() => {
        handlePointSelect(newPoints.length - 2); // Индекс только что добавленной точки
      }, 0);
    }
  }, [routePoints, handlePointSelect, setRoutePoints]);

  const handleLocationToggle = useCallback((location: GetLocationDTO, isSelected: boolean) => {
    if (!isSelected) { // Если нажата кнопка "Отменить точку"
      // Находим точку с этой локацией и снимаем выбор
      const pointIndex = routePoints.findIndex(p => p.location?.id === location.id);

      if (pointIndex !== -1) {
        handlePointClear(pointIndex);
      }
    } else { // Если нажата кнопка "Выбрать точку"
      // Если локация не выбрана и есть пустые точки, выбираем первую пустую
      const emptyPointIndex = routePoints.findIndex(p => p.location === null);
      
      if (emptyPointIndex !== -1) {
        // Есть пустая точка - заполняем её
        const updatedPoints = [...routePoints];

        updatedPoints[emptyPointIndex] = {
          ...updatedPoints[emptyPointIndex],
          location: location
        };
        
        setRoutePoints(updatedPoints);
      } else if (routePoints.length < 5) {
        addIntermediatePoint(location);
      }
    }
  }, [routePoints, handlePointClear, addIntermediatePoint, setRoutePoints]);

  const handleDriverSelect = useCallback((driver: GetDriverDTO | null, location?: { latitude: number; longitude: number }, _fromSearchPanel?: boolean) => {
    setSelectedDriver(driver);

    if (driver && !driver.activeCar && !driver.activeCarId) {
      toast.warn('У выбранного водителя нет активного автомобиля. Назначьте автомобиль перед созданием заказа.');
    }

    if (driver && location) {
      setDynamicMapCenter(location);
      setOpenDriverPopupId(driver.id);
    } else if (driver && driver.currentLocation) {
      // Если водитель выбран из списка и у него есть координаты
      setDynamicMapCenter({
        latitude: driver.currentLocation.latitude,
        longitude: driver.currentLocation.longitude
      });
      setOpenDriverPopupId(driver.id);
    } else {
      // Если водитель отменен
      setDynamicMapCenter(null);
      setOpenDriverPopupId(null);
    }
  }, [setSelectedDriver, setDynamicMapCenter, setOpenDriverPopupId]);

  const getDriverById = useCallback((id: string): Record<string, unknown> | null => {
    return driversDataCache[id] || null;
  }, [driversDataCache]);

  const loadDriverData = useCallback(async (id: string): Promise<void> => {
    try {
      // Проверяем, есть ли уже данные в кэше
      if (driversDataCache[id]) {
        return;
      }
      
      // Загружаем данные водителя
      const driverData = await usersApi.getDriver(id);
      
      // Сохраняем в кэш
      setDriversDataCache(prevCache => ({
        ...prevCache,
        [id]: driverData as unknown as Record<string, unknown>
      }));
    } catch {
      toast.error('Ошибка при загрузке данных водителя:');
    }
  }, [driversDataCache]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    // Данные маршрута
    routePoints,
    isReady,

    // Данные карты
    mapLocations,
    mapCenter,
    dynamicMapCenter,

    // Данные водителей
    drivers,
    allDrivers,
    selectedDriver,
    openDriverPopupId,

    // Состояния UI
    isModalOpen,
    modalTitle,
    selectedPointIndex,

    // Обработчики
    handlePointSelect,
    handleLocationSelect,
    handlePointClear,
    handleReorderPoints,
    handleMapBoundsChange,
    handleDriverSelect,
    handleLocationToggle,
    canSelectLocation,
    addIntermediatePoint,
    closeModal,

    // Функции для работы с данными водителей
    getDriverById,
    loadDriverData,
  };
};
