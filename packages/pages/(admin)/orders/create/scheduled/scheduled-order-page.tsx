'use client';

import { ArrowLeft, Check, Banknote, CreditCard, ChevronDown, Car, CalendarDays, Users, Package, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ApiRequestError } from '@shared/api/client';
import { useOrderData } from '@shared/hooks/useOrderData';
import { logger } from '@shared/lib/logger';
import { customerOrderFormsApi } from '@shared/api/customer-order-forms';
import { Button } from '@shared/ui/forms/button';
import { orderNumberToString } from '@shared/utils/orderNumberConverter';
import type { RoutePoint } from '@shared/components/map/types';
import type { GetLocationDTO } from '@entities/locations/interface';
import {
  orderStatusLabels,
  orderSubStatusLabels,
} from '@entities/orders/constants/order-status-labels';
import { OrderStatus, OrderSubStatus, OrderSubStatusValues, PaymentMethodType } from '@entities/orders/enums';
import {
  useScheduledOrderSubmit,
  useUpdateOrderPassengers,
  useScheduledOrderById,
  useScheduledRideSubmit,
} from '@entities/orders/hooks';
import type { PassengerDTO, GetOrderServiceDTO } from '@entities/orders/interface';
import type { GetTariffDTO } from '@entities/tariffs/interface';
import type { GetDriverDTO } from '@entities/users/interface';
import {
  TariffPricingTab,
  ScheduleTab,
  PassengersTab,
  MapTab,
  ServicesTab,
} from '../../tabs';
import { useSelfProfile } from '@entities/users/hooks/useSelfProfile';
import { usersApi } from '@shared/api/users';
import { locationsApi } from '@shared/api/locations';

// Примерное время завершения: distanceMeters / (80 км/ч если >= 30 км, иначе 50 км/ч)
function calcCompletionTime(startIso: string, distanceMeters: number): string {
  const distanceKm = distanceMeters / 1000;
  const speedKmh = distanceKm >= 30 ? 80 : 50;
  const travelMs = (distanceKm / speedKmh) * 3600 * 1000;
  return new Date(new Date(startIso).getTime() + travelMs).toISOString();
}

// Интерфейс для точки маршрута в форме заказа
interface OrderRoutePoint {
  id: string;
  location: GetLocationDTO | null;
  type: 'start' | 'end' | 'intermediate';
  label: string;
}

// Тип для сервиса в selectedServices используем контракт GetOrderServiceDTO
// Дополнительные данные (цена и т.п.) берём из справочника services по serviceId

interface OrderPageProps {
  mode: 'create' | 'edit';
  id?: string;
  initialTariffId?: string;
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';
  fromFormId?: string;
  initialStartLocationId?: string;
  initialEndLocationId?: string;
  initialServicesJson?: string;
  initialPassengerName?: string;
  initialPassengerPhone?: string;
  initialScheduledTime?: string;
}

// Ray-casting point-in-polygon check.
// poly: flat array [lat1, lng1, lat2, lng2, ...]
function isPointInPolygon(lat: number, lng: number, poly: number[] | null | undefined): boolean {
  if (!poly || poly.length < 6) return false;
  const n = poly.length / 2;
  let inside = false;
  let j = n - 1;
  for (let i = 0; i < n; i++) {
    const latI = poly[i * 2];
    const lngI = poly[i * 2 + 1];
    const latJ = poly[j * 2];
    const lngJ = poly[j * 2 + 1];
    if ((lngI > lng) !== (lngJ > lng) && lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
}

type SegLocPoint = {
  latitude?: number | null;
  longitude?: number | null;
  priceCoefficient?: number | null;
  profile?: { polyPriceCoefficient?: number[] | null } | null;
} | null | undefined;

// Рассчитывает итоговую km-стоимость с учётом коэффициентов точек маршрута.
// Коэффициент пункта назначения применяется только если Точка А (источник сегмента)
// НЕ входит в polyPriceCoefficient-зону пункта назначения. Сравнение областей не используется.
function calcKmPrice(
  routeDistance: number,
  routeLegs: { distance: number }[],
  routePoints: { type: string; location: SegLocPoint }[],
  perKmPrice: number,
): number {
  if (routeDistance <= 0) return 0;

  const getCoeff = (src: SegLocPoint, dst: SegLocPoint): number => {
    const poly = dst?.profile?.polyPriceCoefficient;
    const srcLat = src?.latitude ?? null;
    const srcLng = src?.longitude ?? null;
    if (srcLat !== null && srcLng !== null && poly?.length) {
      if (isPointInPolygon(srcLat, srcLng, poly)) return 1;
    }
    return dst?.priceCoefficient ?? 1;
  };

  const orderedPoints = [
    routePoints.find(p => p.type === 'start'),
    ...routePoints.filter(p => p.type === 'intermediate'),
    routePoints.find(p => p.type === 'end'),
  ].filter(Boolean) as { location: SegLocPoint }[];

  if (routeLegs.length > 0 && routeLegs.length === orderedPoints.length - 1) {
    // Мультистоп: Σ(km_i × coeff_i)
    return routeLegs.reduce((sum, leg, i) => {
      const coeff = getCoeff(orderedPoints[i]?.location, orderedPoints[i + 1]?.location);
      return sum + (leg.distance / 1000) * coeff * perKmPrice;
    }, 0);
  }

  // Fallback: весь маршрут × коэффициент конечной локации (если Точка А не в зоне отключения)
  const startLoc = routePoints.find(p => p.type === 'start')?.location;
  const endLoc = routePoints.find(p => p.type === 'end')?.location;
  const coeff = getCoeff(startLoc, endLoc);
  return (routeDistance / 1000) * coeff * perKmPrice;
}

export function ScheduledOrderPage({
  mode,
  id,
  initialTariffId,
  userRole = 'operator',
  fromFormId,
  initialStartLocationId,
  initialEndLocationId,
  initialServicesJson,
  initialPassengerName,
  initialPassengerPhone,
  initialScheduledTime,
}: OrderPageProps) {
  const router = useRouter();

  // Определяем, находимся ли мы в режиме редактирования
  const isEditMode = mode === 'edit' && !!id;

  // Хук для загрузки заказа при редактировании
  const {
    order: existingOrder,
    isLoading: isLoadingOrder,
    refetch: _refetchOrder,
  } = useScheduledOrderById(isEditMode ? id : null, {
    enabled: isEditMode,
  });

  // Загружаем профиль текущего пользователя для получения скидки (только при создании заказа партнером)
  const { data: selfProfile } = useSelfProfile({
    enabled: userRole === 'partner' && mode === 'create',
  });

  // Определяем актуальную скидку
  const activeSale = isEditMode
    ? existingOrder?.sale
    : userRole === 'partner' && selfProfile?.role === 'Partner'
      ? (selfProfile as any).sale
      : 0;

  // Загружаем реальные данные
  const {
    tariffs,
    services,
    users,
    isLoading: dataLoading,
    isRefreshingTariffs,
    error: dataError,
    refetch,
    refetchTariffs,
  } = useOrderData();
  // Создаем состояние для хранения данных формы
  const [formData, setFormData] = useState({
    scheduledTime: '',
    departureTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    airFlight: '',
    flyReis: '',
    description: '',
    notes: '',
    passengers: [] as PassengerDTO[],
    startLocationId: '',
    endLocationId: '',
    additionalStops: [] as string[],
    routePoints: [] as OrderRoutePoint[],
  });

  // Состояние для карты и водителя (сохраняется между шагами)
  const [selectedDriver, setSelectedDriver] = useState<GetDriverDTO | null>(null);
  // Изначальный водитель заказа (для отслеживания изменений в режиме редактирования)
  const [originalDriver, setOriginalDriver] = useState<GetDriverDTO | null>(null);
  const [dynamicMapCenter, setDynamicMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [openDriverPopupId, setOpenDriverPopupId] = useState<string | null>(null);

  // Кэш данных водителей (сохраняется между табами)
  const [driversDataCache, setDriversDataCache] = useState<Record<string, GetDriverDTO>>({});

  // Функции для работы с кэшем водителей
  const getDriverById = useCallback(
    (id: string): GetDriverDTO | null => {
      return driversDataCache[id] || null;
    },
    [driversDataCache],
  );

  const updateDriverCache = useCallback((id: string, data: GetDriverDTO) => {
    setDriversDataCache(prev => ({
      ...prev,
      [id]: data,
    }));
  }, []);

  // Состояние маршрута (сохраняется между шагами)
  const [routePoints, setRoutePoints] = useState<OrderRoutePoint[]>([
    { id: '1', location: null, type: 'start', label: 'Откуда' },
    { id: '2', location: null, type: 'end', label: 'Куда' },
  ]);

  // Состояние расстояния маршрута (в метрах) и сегментов
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeLegs, setRouteLegs] = useState<{ distance: number }[]>([]);
  const [_routeLoading, setRouteLoading] = useState<boolean>(false);
  // Состояние валидности времени в schedule-tab
  const [scheduleValid, setScheduleValid] = useState<boolean>(true);

  // Состояние для кастомной цены
  const [useCustomPrice, setUseCustomPrice] = useState<boolean>(false);
  const [customPrice, setCustomPrice] = useState<string>('');

  // Состояние для метода оплаты и суммы водителя
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodType>(
    userRole === 'partner' ? PaymentMethodType.Card : PaymentMethodType.Cash,
  );
  const [driverPrice, setDriverPrice] = useState<string>('');
  const [operatorNotes, setOperatorNotes] = useState<string>('');

  const [includeIntermediateInPrice] = useState<boolean>(true);

  // Функция для обработки изменения кастомной цены
  const handleCustomPriceChange = (value: string) => {
    setCustomPrice(value);
  };

  // Функция для переключения использования кастомной цены
  const toggleCustomPrice = () => {
    setUseCustomPrice(!useCustomPrice);
    if (!useCustomPrice) {
      // При включении кастомной цены устанавливаем текущую рассчитанную цену
      setCustomPrice(currentPrice.toString());
    }
  };

  // Состояние для статуса заказа (для редактирования)
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.Pending);
  const [_originalOrderStatus, setOriginalOrderStatus] = useState<OrderStatus>(OrderStatus.Pending);
  const [orderSubStatus, setOrderSubStatus] = useState<OrderSubStatus>(
    OrderSubStatus.SearchingDriver,
  );

  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(['pricing']));
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const methods = useMemo(
    () => ({
      getValues: (key?: string): unknown => {
        if (key) {
          return formData[key as keyof typeof formData];
        }

        return formData;
      },
      setValue: (key: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [key]: value }));
      },
    }),
    [formData],
  );


  // Состояния формы заказа
  const [selectedTariff, setSelectedTariff] = useState<GetTariffDTO | null>(null);
  const [selectedServices, setSelectedServices] = useState<GetOrderServiceDTO[]>(() => {
    if (initialServicesJson) {
      try {
        return JSON.parse(initialServicesJson) as GetOrderServiceDTO[];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Автоматический выбор тарифа при создании заказа
  useEffect(() => {
    if (mode === 'create' && initialTariffId && tariffs.length > 0 && !selectedTariff) {
      const foundTariff = tariffs.find(t => t.id === initialTariffId);

      if (foundTariff && !foundTariff.archived) {
        setSelectedTariff(foundTariff);
      }
    }
  }, [mode, initialTariffId, tariffs, selectedTariff]);

  // Предзаполнение локаций из заявки при создании — загружаем объекты локаций и заполняем routePoints
  useEffect(() => {
    if (mode !== 'create') return;
    if (!initialStartLocationId && !initialEndLocationId) return;

    if (initialStartLocationId) methods.setValue('startLocationId', initialStartLocationId);
    if (initialEndLocationId) methods.setValue('endLocationId', initialEndLocationId);

    let cancelled = false;
    const fetchLocations = async () => {
      const [startLoc, endLoc] = await Promise.all([
        initialStartLocationId ? locationsApi.getLocationById(initialStartLocationId).catch(() => null) : null,
        initialEndLocationId ? locationsApi.getLocationById(initialEndLocationId).catch(() => null) : null,
      ]);
      if (cancelled) return;
      setRoutePoints(prev => prev.map(p => {
        if (p.type === 'start' && startLoc) return { ...p, location: startLoc as unknown as GetLocationDTO };
        if (p.type === 'end' && endLoc) return { ...p, location: endLoc as unknown as GetLocationDTO };
        return p;
      }));
    };
    fetchLocations();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialStartLocationId, initialEndLocationId]);

  // Предзаполнение даты поездки из заявки при создании
  useEffect(() => {
    if (mode === 'create' && initialScheduledTime) {
      methods.setValue('scheduledTime', initialScheduledTime);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialScheduledTime]);

  // Предзаполнение пассажира из заявки при создании
  useEffect(() => {
    if (mode === 'create' && (initialPassengerName || initialPassengerPhone)) {
      methods.setValue('passengers', [
        {
          id: `passenger-${Date.now()}`,
          customerId: null,
          firstName: initialPassengerName ?? '',
          lastName: null,
          phone: initialPassengerPhone ?? null,
          isMainPassenger: true,
        },
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialPassengerName, initialPassengerPhone]);

  // Автоматический расчет цены при изменении тарифа, расстояния или услуг
  useEffect(() => {
    if (selectedTariff) {
      const kmPrice = calcKmPrice(routeDistance, routeLegs, routePoints, selectedTariff.perKmPrice);

      const servicesTotal = selectedServices.reduce((total, service) => {
        const serviceInfo = services.find(s => s.id === service.serviceId);
        return total + (serviceInfo?.price || 0) * (service.quantity || 1);
      }, 0);

      const discountMultiplier = activeSale ? (1 - activeSale) : 1;
      const finalPrice = Math.round(
        (selectedTariff.basePrice + kmPrice) * discountMultiplier + servicesTotal,
      );

      setCurrentPrice(finalPrice);
    } else {
      setCurrentPrice(0);
    }
  }, [
    selectedTariff,
    routeDistance,
    routeLegs,
    selectedServices,
    services,
    routePoints,
    activeSale,
  ]);

  const handlePassengersChange = (newPassengers: PassengerDTO[]) => {
    // Обновляем форму с новыми пассажирами
    methods.setValue('passengers', newPassengers);
    // Принудительно обновляем состояние для перерендера
    setFormData(prev => ({ ...prev, passengers: newPassengers }));
  };

  const handleRoutePointsChange = useCallback(
    (
      startLocationId: string,
      endLocationId: string,
      routePoints: {
        id: string;
        location: GetLocationDTO | null;
        type: 'start' | 'end' | 'intermediate';
        label: string;
      }[],
    ) => {
      // Извлекаем ID промежуточных точек
      const additionalStops = routePoints
        .filter(p => p.type === 'intermediate' && p.location)
        .map(p => p.location!.id);

      // Проверяем, изменились ли данные
      const currentStartLocationId = methods.getValues('startLocationId');
      const currentEndLocationId = methods.getValues('endLocationId');
      const currentAdditionalStops = methods.getValues('additionalStops');
      const currentRoutePoints = methods.getValues('routePoints');

      if (
        currentStartLocationId === startLocationId &&
        currentEndLocationId === endLocationId &&
        JSON.stringify(currentAdditionalStops || []) === JSON.stringify(additionalStops) &&
        JSON.stringify(currentRoutePoints) === JSON.stringify(routePoints)
      ) {
        return; // Данные не изменились, не обновляем
      }

      // Обновляем форму с новыми точками маршрута И additionalStops
      setFormData(prev => ({
        ...prev,
        startLocationId,
        endLocationId,
        additionalStops, // ✅ Теперь обновляем additionalStops!
        routePoints,
      }));

      // Также обновляем форму через methods для синхронизации
      methods.setValue('startLocationId', startLocationId);
      methods.setValue('endLocationId', endLocationId);
      methods.setValue('additionalStops', additionalStops);
    },
    [methods],
  );

  const mapTabRoutePointsChange = handleRoutePointsChange;

  // Функция для определения, нужно ли назначать водителя в режиме редактирования
  const shouldAssignDriverInEditMode = useCallback(() => {
    if (!isEditMode) {
      return false;
    }

    // Если изначально водителя не было, но теперь выбран
    if (!originalDriver && selectedDriver) {
      return true;
    }

    // Если водитель был изменен на другого
    if (originalDriver && selectedDriver && originalDriver.id !== selectedDriver.id) {
      return true;
    }

    return false;
  }, [isEditMode, originalDriver, selectedDriver]);


  const handleServicesChange = (newServices: GetOrderServiceDTO[]) => {
    setSelectedServices(newServices);
  };


  // Состояние для отслеживания, что данные уже загружены
  const [isOrderDataLoaded, setIsOrderDataLoaded] = useState(false);

  // Отладочная информация
  useEffect(() => {
    if (isEditMode) {
    }
  }, [isEditMode, id, isLoadingOrder, existingOrder]);

  // Получаем номер заказа для отображения в заголовке
  const orderNumber = existingOrder?.orderNumber
    ? orderNumberToString(existingOrder.orderNumber)
    : '';

  // Заполняем данные заказа при загрузке (только один раз)
  useEffect(() => {
    if (existingOrder && !isOrderDataLoaded && tariffs.length > 0 && services.length > 0) {
      // 1. Заполняем основные поля
      const currentStatus = existingOrder.status as OrderStatus;

      setOrderStatus(currentStatus);
      setOriginalOrderStatus(currentStatus); // Сохраняем оригинальный статус

      // initialPrice уже в сомах, не нужно конвертировать
      setCustomPrice(existingOrder.initialPrice?.toString() || '');

      // Включаем кастомную цену только если она отличается от автоматически рассчитанной
      // (будет проверено позже в useEffect после расчета currentPrice)

      // 2. Устанавливаем выбранный тариф
      if (existingOrder.tariffId) {
        const foundTariff = tariffs.find(t => t.id === existingOrder.tariffId);

        if (foundTariff) {
          setSelectedTariff(foundTariff);
        }
      }

      // 3. Заполняем данные формы через methods
      if (methods) {
        // Время и дата
        if (existingOrder.scheduledTime) {
          methods.setValue('scheduledTime', existingOrder.scheduledTime);
        }

        // Поля рейсов и описания
        methods.setValue('description', existingOrder.description || '');
        methods.setValue('airFlight', existingOrder.airFlight || '');
        methods.setValue('flyReis', existingOrder.flyReis || '');
        methods.setValue('notes', existingOrder.notes || '');
        if (existingOrder.operatorNotes) {
          setOperatorNotes(existingOrder.operatorNotes);
        }

        // Локации маршрута (сервер может вернуть как объект startLocation, так и ID startLocationId)
        const startLocId = existingOrder.startLocation?.id || existingOrder.startLocationId;
        const endLocId = existingOrder.endLocation?.id || existingOrder.endLocationId;
        if (startLocId) methods.setValue('startLocationId', startLocId);
        if (endLocId) methods.setValue('endLocationId', endLocId);
        if (existingOrder.additionalStops && existingOrder.additionalStops.length > 0) {
          methods.setValue('additionalStops', existingOrder.additionalStops);
        }

        // Пассажиры - дополняем недостающие поля
        if (existingOrder.passengers && existingOrder.passengers.length > 0) {
          const enhancedPassengers = existingOrder.passengers.map(passenger => ({
            ...passenger,
            lastName: passenger.lastName || '',
            phone: passenger.phone || '',
          }));

          methods.setValue('passengers', enhancedPassengers);
        }
      }

      // 4. Устанавливаем выбранные услуги
      if (existingOrder.services && existingOrder.services.length > 0) {
        const selectedServicesFromOrder: GetOrderServiceDTO[] = [];

        existingOrder.services.forEach(orderService => {
          const foundService = services.find(s => s.id === orderService.serviceId);

          if (foundService) {
            const dto: GetOrderServiceDTO = {
              serviceId: foundService.id,
              quantity: orderService.quantity,
              name: foundService.name,
            };

            if (orderService.notes !== undefined) {
              dto.notes = orderService.notes;
            }

            selectedServicesFromOrder.push(dto);
          }
        });

        setSelectedServices(selectedServicesFromOrder);
      }

      // 5. Устанавливаем метод оплаты и сумму водителя
      if (existingOrder.paymentMethodType) {
        setPaymentMethodType(existingOrder.paymentMethodType);
      }
      if (existingOrder.driverPrice != null) {
        setDriverPrice(existingOrder.driverPrice.toString());
      }

      // Отмечаем, что данные загружены
      setIsOrderDataLoaded(true);

      // TODO: 5. Загрузить и установить локации по ID
    }
  }, [existingOrder, isOrderDataLoaded, tariffs, services, methods, getDriverById]);

  // Загружаем водителя сразу как только доступен existingOrder — независимо от тарифов/услуг
  const isDriverLoadedRef = useRef(false);
  useEffect(() => {
    if (!isEditMode || !existingOrder) return;
    if (isDriverLoadedRef.current) return;

    const rides = existingOrder.rides;
    if (!rides || rides.length === 0) return;

    const driverId = rides[0].driverId;
    if (!driverId) return;

    isDriverLoadedRef.current = true;

    const cached = getDriverById(driverId);
    if (cached) {
      setSelectedDriver(cached);
      setOriginalDriver(cached);
      return;
    }

    usersApi.getDriver(driverId)
      .then(fetchedDriver => {
        updateDriverCache(driverId, fetchedDriver);
        setSelectedDriver(fetchedDriver);
        setOriginalDriver(fetchedDriver);
      })
      .catch(err => {
        logger.error('Ошибка загрузки водителя:', err);
        isDriverLoadedRef.current = false; // разрешаем повтор при ошибке
      });
  }, [isEditMode, existingOrder, getDriverById, updateDriverCache]);

  // Автоматическое управление кастомной ценой в зависимости от разности с рассчитанной
  useEffect(() => {
    if (isEditMode && existingOrder && currentPrice > 0 && customPrice) {
      const customPriceValue = parseFloat(customPrice);
      const priceDifference = Math.abs(customPriceValue - currentPrice);

      // Если разница больше 1 сома (запас на округление), включаем кастомную цену
      if (priceDifference > 1) {
        setUseCustomPrice(true);
      } else {
        // Если цены совпадают (с учетом возможной партнерской скидки, которая уже в currentPrice),
        // выключаем кастомную цену
        setUseCustomPrice(false);
      }
    }
  }, [isEditMode, existingOrder, currentPrice, customPrice]);

  // Хук для обновления пассажиров заказа (не используется, обновление происходит в useScheduledOrderSubmit)
  const {
    updatePassengers: _updatePassengers,
    isLoading: _isUpdatingPassengers,
    error: _updatePassengersError,
  } = useUpdateOrderPassengers();

  // Хук для отправки/обновления заказа
  const {
    submitOrder,
    isLoading: isSubmittingOrder,
    error: submitError,
  } = useScheduledOrderSubmit({
    orderId: isEditMode ? id : undefined, // Передаем ID для режима редактирования
    shouldUpdatePassengers: isEditMode, // Обновляем пассажиров только при редактировании
    passengers: isEditMode
      ? (
          methods.getValues('passengers') as Array<{
            customerId: string;
            firstName: string;
            lastName: string;
            phone?: string | null;
            isMainPassenger: boolean;
          }>
        )?.map(p => ({
          customerId: p.customerId,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone || null,
          isMainPassenger: p.isMainPassenger,
        }))
      : undefined,
    onSuccess: _order => {
      // Если заказ создан из заявки — отмечаем заявку как принятую
      if (mode === 'create' && fromFormId) {
        customerOrderFormsApi.updateStatus(fromFormId, 'Verified').catch(() => {
          // Не блокируем основной флоу при ошибке обновления статуса заявки
        });
      }
      // Не переходим сразу к списку заказов, если нужно назначить водителя
      // Переход происходит после назначения водителя или если водитель не выбран
      if (!selectedDriver) {
        router.push('/orders');
      }
    },
    onError: _error => {
      // Обработка ошибки создания/обновления заказа
    },
  });

  // Хук для назначения водителя на запланированный заказ
  const { assignDriver, isLoading: isAssigningDriver } = useScheduledRideSubmit({
    onSuccess: () => {
      // После назначения водителя переходим к списку заказов
      router.push('/orders');
    },
  });

  // Показываем ошибку отправки если есть
  if (submitError) {
    // Ошибка отправки обрабатывается в UI
  }

  const handleBack = () => {
    router.push('/orders');
  };

  const handleSave = async () => {
    // Валидация обязательных полей
    if (!selectedTariff) {
      toast.error('Выберите тариф', {
        description: 'Нажмите раздел «Тариф» и выберите класс автомобиля',
      });
      setOpenSections(prev => { const s = new Set(prev); s.add('pricing'); return s; });
      return;
    }

    if (!formData.startLocationId || !formData.endLocationId) {
      toast.error('Укажите маршрут', {
        description: 'Выберите точку отправления и назначения на карте',
      });
      setOpenSections(prev => { const s = new Set(prev); s.add('map'); return s; });
      return;
    }

    if (!scheduleValid || !formData.scheduledTime) {
      toast.error('Укажите дату и время', {
        description: 'Выберите дату и время поездки',
      });
      setOpenSections(prev => { const s = new Set(prev); s.add('schedule'); return s; });
      return;
    }

    if (!passengersValid) {
      toast.error('Добавьте пассажира', {
        description: 'Необходимо добавить хотя бы одного пассажира',
      });
      setOpenSections(prev => { const s = new Set(prev); s.add('passengers'); return s; });
      return;
    }

    if (!routeDistance || routeDistance === 0) {
      toast.error('Маршрут не построен', {
        description: 'Дождитесь построения маршрута для расчёта времени завершения',
      });
      setOpenSections(prev => { const s = new Set(prev); s.add('map'); return s; });
      return;
    }

    // Для admin/operator — проверяем что driverPrice заполнена
    if ((userRole === 'admin' || userRole === 'operator') && !driverPrice) {
      toast.error('Укажите сумму водителя', {
        description: 'Заполните поле "Сумма водителя" в правой панели',
      });

      return;
    }

    try {
      // Получаем реальные точки маршрута с локациями
      const routePointsWithLocations = routePoints.filter(point => point.location);

      // Формируем данные для отправки согласно API
      // В режиме редактирования используем данные существующего заказа как запасной вариант,
      // если пользователь не посещал вкладку карты и routePoints не содержат объекты локаций
      const startLoc = routePointsWithLocations[0]?.location ?? (isEditMode ? existingOrder?.startLocation : null);
      const endLoc = routePointsWithLocations[routePointsWithLocations.length - 1]?.location ?? (isEditMode ? existingOrder?.endLocation : null);

      // Для ID также используем startLocId/endLocId как запасной вариант
      const startLocationId = startLoc?.id || (isEditMode ? existingOrder?.startLocationId : null) || null;
      const endLocationId = endLoc?.id || (isEditMode ? existingOrder?.endLocationId : null) || null;

      const orderData = {
        tariffId: selectedTariff?.id || '',
        routeId: null,
        startLocationId,
        endLocationId,
        startAddress: startLoc?.address || startLoc?.name || '',
        endAddress: endLoc?.address || endLoc?.name || '',
        additionalStops: routePointsWithLocations.slice(1, -1).map(point => point.location!.id),
        services: selectedServices
          .filter(service => !!service.serviceId) // Фильтруем сервисы без ID
          .map(service => ({
            serviceId: service.serviceId,
            quantity: service.quantity || 1,
            notes: service.notes || null,
          })),
        initialPrice: (() => {
          // Если используется кастомная цена, отправляем её
          if (useCustomPrice && customPrice) {
            const customPriceNum = parseFloat(customPrice);

            return isNaN(customPriceNum) ? 0 : customPriceNum;
          }

          // Иначе рассчитываем автоматически
          if (!selectedTariff) return 0;

          const kmPrice = calcKmPrice(routeDistance, routeLegs, routePoints, selectedTariff.perKmPrice || 0);
          const servicesPrice = selectedServices.reduce((sum, sel) => {
            const svc = services.find(s => s.id === sel.serviceId);
            return sum + (svc?.price || 0) * (sel.quantity || 1);
          }, 0);
          const discountMultiplier = activeSale ? 1 - activeSale : 1;

          return Math.round(((selectedTariff.basePrice || 0) + kmPrice) * discountMultiplier + servicesPrice);
        })(),
        scheduledTime: (() => {
          const dateValue = methods.getValues('scheduledTime');

          if (dateValue && typeof dateValue === 'string') {
            // Конвертируем в UTC формат для PostgreSQL
            const date = new Date(dateValue);

            return date.toISOString(); // Всегда возвращает UTC
          }

          return new Date().toISOString(); // Текущая дата в UTC
        })(),
        completionTimeEstimate: (() => {
          const dateValue = methods.getValues('scheduledTime');
          const startIso = (dateValue && typeof dateValue === 'string')
            ? new Date(dateValue).toISOString()
            : new Date().toISOString();
          return calcCompletionTime(startIso, routeDistance);
        })(),
        passengers: (() => {
          const passengersData = methods.getValues('passengers');
          const passengers = Array.isArray(passengersData)
            ? (passengersData as PassengerDTO[])
            : [];

          return passengers.map((passenger: PassengerDTO) => ({
            customerId: passenger.customerId || null,
            phone: passenger.phone || null,
            firstName: passenger.firstName,
            lastName: passenger.lastName || null,
            isMainPassenger: passenger.isMainPassenger,
          }));
        })(),
        description: (() => {
          const value = methods.getValues('description');

          return value && typeof value === 'string' ? value : null;
        })(),
        airFlight: (() => {
          const value = methods.getValues('airFlight');

          return value && typeof value === 'string'
            ? value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '')
            : null;
        })(),
        flyReis: (() => {
          const value = methods.getValues('flyReis');

          return value && typeof value === 'string'
            ? value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '')
            : null;
        })(),
        notes: (() => {
          const value = methods.getValues('notes');

          return value && typeof value === 'string' ? value : null;
        })(),
        operatorNotes:
          userRole === 'admin' || userRole === 'operator'
            ? operatorNotes.trim() || null
            : null,
        paymentMethodType: userRole === 'partner' ? PaymentMethodType.Card : paymentMethodType,
        driverPrice:
          (userRole === 'admin' || userRole === 'operator') && driverPrice
            ? parseFloat(driverPrice) || null
            : null,
      };

      // Отправляем или обновляем заказ в зависимости от режима
      // Обновление пассажиров теперь обрабатывается внутри хука useScheduledOrderSubmit
      const finalOrderData = {
        ...orderData,
        status: orderStatus,
        subStatus: orderSubStatus,
      };

      const resultOrder = await submitOrder(finalOrderData);

      // Назначаем водителя если:
      // - режим создания и водитель выбран
      // - режим редактирования и водитель изменился (новый или заменён)
      const shouldAssignDriver =
        selectedDriver && (!isEditMode || shouldAssignDriverInEditMode());

      if (shouldAssignDriver) {
        const carId = selectedDriver!.activeCar?.id || selectedDriver!.activeCarId;

        if (!carId) {
          toast.error('У выбранного водителя нет активного автомобиля. Назначьте автомобиль и попробуйте снова.');
          return;
        }

        const orderIdForDriver = isEditMode ? id : resultOrder?.id;

        if (!orderIdForDriver) {
          toast.error('Не удалось получить ID созданного заказа. Обновите страницу и попробуйте снова.');
          return;
        }

        const rideData = {
          driverId: selectedDriver!.id,
          carId,
          waypoints: [],
        };

        // useScheduledRideSubmit.onError всегда показывает toast при ошибке,
        // поэтому ошибку из mutateAsync достаточно поймать и прервать выполнение
        await assignDriver(orderIdForDriver, rideData);
      } else {
        // Водитель не изменился — ride не пересоздаём, просто переходим к списку заказов.
        // Toast об успешном сохранении уже показан в useScheduledOrderSubmit.
        router.push('/orders');
      }
    } catch (error) {
      logger.error('Ошибка сохранения заказа:', error);
      // Ошибки из мутаций (submitOrder, assignDriver) уже обработаны в их onError-колбэках.
      // Сюда доходят только неожиданные ошибки, которые не являются ApiRequestError.
      if (!(error instanceof ApiRequestError)) {
        const message = error instanceof Error ? error.message : 'Произошла непредвиденная ошибка';
        toast.error(message);
      }
    }
  };

  const passengersValid = (() => {
    const passengers = formData.passengers as Array<{ phone?: string | null }>;
    return (
      Array.isArray(passengers) &&
      passengers.length > 0 &&
      passengers.every(p => p.phone && p.phone.trim().length > 0)
    );
  })();

  // Блокируем рендер до загрузки всех необходимых данных
  const isDataLoading = dataLoading || (isEditMode && isLoadingOrder);

  if (isDataLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4' />
          <p className='text-muted-foreground'>
            {isEditMode ? 'Загрузка заказа...' : 'Загрузка данных...'}
          </p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>Ошибка загрузки данных: {dataError}</p>
          <Button onClick={refetch} variant='outline'>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full overflow-hidden bg-slate-50 rounded-2xl border border-slate-200'>

      {/* === Compact header === */}
      <div className='flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={handleBack}
            className='w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors'
          >
            <ArrowLeft className='h-4 w-4' />
          </button>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-sm font-bold text-slate-900'>
                {mode === 'create' ? 'Новый заказ' : 'Редактировать заказ'}
              </h1>
              {mode === 'edit' && orderNumber && (
                <span className='text-xs font-bold text-blue-600'>#{orderNumber}</span>
              )}
              <span className='text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium'>
                Запланированный
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {/* Progress bar */}
          <div className='flex items-center gap-1'>
            {[
              !!selectedTariff,
              !!(formData.startLocationId && formData.endLocationId),
              !!(scheduleValid && formData.scheduledTime),
              passengersValid,
            ].map((done, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full transition-colors ${done ? 'bg-emerald-400' : 'bg-slate-200'}`}
              />
            ))}
          </div>

          {mode === 'edit' && (
            <div className='flex gap-1.5'>
              <select
                value={orderStatus}
                onChange={e => setOrderStatus(e.target.value as OrderStatus)}
                className='text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700'
              >
                <option value={OrderStatus.Pending}>{orderStatusLabels.Pending}</option>
                <option value={OrderStatus.Scheduled}>{orderStatusLabels.Scheduled}</option>
                <option value={OrderStatus.InProgress}>{orderStatusLabels.InProgress}</option>
                <option value={OrderStatus.Completed}>{orderStatusLabels.Completed}</option>
                <option value={OrderStatus.Cancelled}>{orderStatusLabels.Cancelled}</option>
                <option value={OrderStatus.Expired}>{orderStatusLabels.Expired}</option>
              </select>
              <select
                value={orderSubStatus}
                onChange={e => setOrderSubStatus(e.target.value as OrderSubStatus)}
                className='text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700'
              >
                {OrderSubStatusValues.map(status => (
                  <option key={status} value={status}>
                    {orderSubStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* === Body === */}
      <div className='flex flex-1 overflow-hidden min-h-0'>

        {/* Left: collapsible sections */}
        <div className='flex-1 overflow-y-auto p-3 space-y-2'>

          {/* Section 1: Тариф */}
          <div className={`rounded-xl bg-white border overflow-hidden shadow-sm transition-all ${
            selectedTariff
              ? 'border-l-[3px] border-l-emerald-400 border-slate-100'
              : openSections.has('pricing')
                ? 'border-blue-200'
                : 'border-slate-100'
          }`}>
            <button
              type='button'
              onClick={() => toggleSection('pricing')}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                openSections.has('pricing') ? 'border-b border-slate-100' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedTariff
                    ? 'bg-emerald-50 text-emerald-600'
                    : openSections.has('pricing')
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {selectedTariff ? <Check className='h-4 w-4' /> : <Car className='h-3.5 w-3.5' />}
                </div>
                <div>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-sm font-semibold text-slate-800'>Тариф</span>
                    {selectedTariff && (
                      <span className='text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md'>
                        {selectedTariff.name}
                      </span>
                    )}
                  </div>
                  {!openSections.has('pricing') && !selectedTariff && (
                    <p className='text-xs text-slate-400 mt-0.5'>Выберите класс автомобиля</p>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                openSections.has('pricing') ? 'rotate-180' : ''
              }`} />
            </button>
            {openSections.has('pricing') && (
              <div className='px-4 pt-3 pb-4'>
                <TariffPricingTab
                  tariffs={tariffs}
                  selectedTariff={selectedTariff}
                  setSelectedTariff={setSelectedTariff}
                  onRefreshTariffs={refetchTariffs}
                  isRefreshingTariffs={isRefreshingTariffs}
                  userRole={userRole}
                  initialTariffId={initialTariffId}
                />
              </div>
            )}
          </div>

          {/* Section 2: Маршрут — always mounted to avoid map re-init */}
          <div className={`rounded-xl bg-white border overflow-hidden shadow-sm transition-all ${
            (formData.startLocationId && formData.endLocationId)
              ? 'border-l-[3px] border-l-emerald-400 border-slate-100'
              : openSections.has('map')
                ? 'border-blue-200'
                : 'border-slate-100'
          }`}>
            <button
              type='button'
              onClick={() => toggleSection('map')}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                openSections.has('map') ? 'border-b border-slate-100' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  (formData.startLocationId && formData.endLocationId)
                    ? 'bg-emerald-50 text-emerald-600'
                    : openSections.has('map')
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {(formData.startLocationId && formData.endLocationId)
                    ? <Check className='h-4 w-4' />
                    : <MapPin className='h-3.5 w-3.5' />}
                </div>
                <div>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-sm font-semibold text-slate-800'>Маршрут</span>
                    {routeDistance > 0 && (
                      <span className='text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md'>
                        {Math.round(routeDistance / 100) / 10} км
                      </span>
                    )}
                  </div>
                  {!openSections.has('map') && !(formData.startLocationId && formData.endLocationId) && (
                    <p className='text-xs text-slate-400 mt-0.5'>Укажите откуда и куда</p>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                openSections.has('map') ? 'rotate-180' : ''
              }`} />
            </button>
            <div style={{ display: openSections.has('map') ? 'block' : 'none', height: '580px' }}>
              <MapTab
                startLocationId={
                  (isEditMode ? existingOrder?.startLocation?.id || existingOrder?.startLocationId : undefined) ||
                  formData.startLocationId || ''
                }
                endLocationId={
                  (isEditMode ? existingOrder?.endLocation?.id || existingOrder?.endLocationId : undefined) ||
                  formData.endLocationId || ''
                }
                additionalStops={
                  isEditMode && existingOrder?.additionalStops
                    ? existingOrder.additionalStops
                    : formData.additionalStops || []
                }
                mode={mode}
                rides={existingOrder?.rides}
                routePoints={routePoints as unknown as RoutePoint[]}
                setRoutePoints={setRoutePoints as unknown as (points: RoutePoint[]) => void}
                selectedDriver={selectedDriver as unknown as GetDriverDTO}
                setSelectedDriver={setSelectedDriver as unknown as (driver: unknown) => void}
                dynamicMapCenter={dynamicMapCenter}
                setDynamicMapCenter={setDynamicMapCenter}
                openDriverPopupId={openDriverPopupId}
                setOpenDriverPopupId={setOpenDriverPopupId}
                onRoutePointsChange={mapTabRoutePointsChange as never}
                onRouteDistanceChange={setRouteDistance}
                onRouteLegsChange={setRouteLegs}
                onRouteLoadingChange={setRouteLoading}
                selectedTariff={selectedTariff as unknown as GetTariffDTO}
                scheduledTime={(formData.scheduledTime as string) || existingOrder?.scheduledTime}
                completionTimeEstimate={existingOrder?.completionTimeEstimate}
                requestedCarId={existingOrder?.requestedCar}
                userRole={userRole}
              />
            </div>
          </div>

          {/* Section 3: Дата и время */}
          <div className={`rounded-xl bg-white border overflow-hidden shadow-sm transition-all ${
            (scheduleValid && formData.scheduledTime)
              ? 'border-l-[3px] border-l-emerald-400 border-slate-100'
              : openSections.has('schedule')
                ? 'border-blue-200'
                : 'border-slate-100'
          }`}>
            <button
              type='button'
              onClick={() => toggleSection('schedule')}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                openSections.has('schedule') ? 'border-b border-slate-100' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  (scheduleValid && formData.scheduledTime)
                    ? 'bg-emerald-50 text-emerald-600'
                    : openSections.has('schedule')
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {(scheduleValid && formData.scheduledTime)
                    ? <Check className='h-4 w-4' />
                    : <CalendarDays className='h-3.5 w-3.5' />}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold text-slate-800'>Дата и время</span>
                    {formData.scheduledTime && scheduleValid && (
                      <span className='text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md'>
                        {new Date(formData.scheduledTime as string).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  {!openSections.has('schedule') && !(scheduleValid && formData.scheduledTime) && (
                    <p className='text-xs text-slate-400 mt-0.5'>Укажите дату и время поездки</p>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                openSections.has('schedule') ? 'rotate-180' : ''
              }`} />
            </button>
            {openSections.has('schedule') && (
              <div className='px-4 pt-3 pb-4'>
                <ScheduleTab
                  onScheduleChange={(scheduledTime: string) => {
                    methods.setValue('scheduledTime', scheduledTime);
                    if (isEditMode && orderStatus === OrderStatus.Expired) {
                      setOrderStatus(OrderStatus.Pending);
                    }
                  }}
                  onValidityChange={setScheduleValid}
                  initialScheduledTime={formData.scheduledTime as string}
                  methods={methods as never}
                />
              </div>
            )}
          </div>

          {/* Section 4: Пассажиры */}
          <div className={`rounded-xl bg-white border overflow-hidden shadow-sm transition-all ${
            passengersValid
              ? 'border-l-[3px] border-l-emerald-400 border-slate-100'
              : openSections.has('passengers')
                ? 'border-blue-200'
                : 'border-slate-100'
          }`}>
            <button
              type='button'
              onClick={() => toggleSection('passengers')}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                openSections.has('passengers') ? 'border-b border-slate-100' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  passengersValid
                    ? 'bg-emerald-50 text-emerald-600'
                    : openSections.has('passengers')
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {passengersValid ? <Check className='h-4 w-4' /> : <Users className='h-3.5 w-3.5' />}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold text-slate-800'>Пассажиры</span>
                    {formData.passengers.length > 0 && (
                      <span className='text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md'>
                        {formData.passengers.length} чел.
                      </span>
                    )}
                  </div>
                  {!openSections.has('passengers') && !passengersValid && (
                    <p className='text-xs text-slate-400 mt-0.5'>Добавьте хотя бы одного пассажира</p>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                openSections.has('passengers') ? 'rotate-180' : ''
              }`} />
            </button>
            {openSections.has('passengers') && (
              <div className='px-4 pt-3 pb-4'>
                <PassengersTab
                  users={users}
                  passengers={formData.passengers as never[]}
                  handlePassengersChange={handlePassengersChange as never}
                  selectedTariff={selectedTariff as unknown as GetTariffDTO}
                  userRole={userRole}
                />
              </div>
            )}
          </div>

          {/* Section 5: Доп. услуги */}
          <div className={`rounded-xl bg-white border overflow-hidden shadow-sm transition-all ${
            selectedServices.length > 0
              ? 'border-l-[3px] border-l-emerald-400 border-slate-100'
              : openSections.has('services')
                ? 'border-blue-200'
                : 'border-slate-100'
          }`}>
            <button
              type='button'
              onClick={() => toggleSection('services')}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                openSections.has('services') ? 'border-b border-slate-100' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedServices.length > 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : openSections.has('services')
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {selectedServices.length > 0 ? <Check className='h-4 w-4' /> : <Package className='h-3.5 w-3.5' />}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold text-slate-800'>Доп. услуги</span>
                    <span className='text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium'>
                      необязательно
                    </span>
                    {selectedServices.length > 0 && (
                      <span className='text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md'>
                        {selectedServices.length} выбрано
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                openSections.has('services') ? 'rotate-180' : ''
              }`} />
            </button>
            {openSections.has('services') && (
              <div className='px-4 pt-3 pb-4'>
                <ServicesTab
                  services={services}
                  selectedServices={selectedServices}
                  handleServicesChange={handleServicesChange}
                />
              </div>
            )}
          </div>

        </div>

        {/* Right: sidebar */}
        <div className='w-80 border-l border-slate-200 bg-white flex flex-col flex-shrink-0'>
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>

            {/* Price summary */}
            <div className='rounded-xl bg-slate-50 border border-slate-100 p-4'>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>Стоимость</p>
              {selectedTariff ? (
                <div className='space-y-2'>
                  <div className='flex justify-between items-center text-xs'>
                    <span className='text-slate-500'>Базовая ({selectedTariff.name})</span>
                    <span className='font-medium text-slate-700'>{selectedTariff.basePrice} сом</span>
                  </div>
                  {routeDistance > 0 && (
                    <div className='flex justify-between items-center text-xs'>
                      <span className='text-slate-500'>
                        {Math.round(routeDistance / 100) / 10} км × {selectedTariff.perKmPrice}
                      </span>
                      <span className='font-medium text-slate-700'>
                        {Math.round(calcKmPrice(routeDistance, routeLegs, routePoints, selectedTariff.perKmPrice))} сом
                      </span>
                    </div>
                  )}
                  {selectedServices.map(s => {
                    const svc = services.find(sv => sv.id === s.serviceId);
                    return svc ? (
                      <div key={s.serviceId} className='flex justify-between items-center text-xs'>
                        <span className='text-slate-500'>{svc.name} ×{s.quantity || 1}</span>
                        <span className='font-medium text-slate-700'>{svc.price * (s.quantity || 1)} сом</span>
                      </div>
                    ) : null;
                  })}
                  {activeSale && activeSale > 0 && (
                    <div className='flex justify-between items-center text-xs text-emerald-600'>
                      <span>Скидка {Math.round(activeSale * 100)}%</span>
                      <span>−{Math.round((currentPrice / (1 - activeSale)) * activeSale)} сом</span>
                    </div>
                  )}
                  <div className='border-t border-slate-200 mt-1 pt-2.5 flex justify-between items-baseline'>
                    <span className='text-sm font-semibold text-slate-800'>Итого</span>
                    <div className='text-right'>
                      <span className='text-xl font-bold text-slate-900'>
                        {useCustomPrice && customPrice ? (parseFloat(customPrice) || 0) : currentPrice}
                      </span>
                      <span className='text-sm text-slate-400 ml-1'>сом</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='py-4 text-center'>
                  <Car className='h-7 w-7 text-slate-200 mx-auto mb-2' />
                  <p className='text-xs text-slate-400'>Выберите тариф для расчёта</p>
                </div>
              )}
            </div>

            {/* Payment method */}
            {userRole !== 'partner' && (
              <div>
                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>Оплата</p>
                <div className='grid grid-cols-2 gap-1.5'>
                  <button
                    type='button'
                    onClick={() => setPaymentMethodType(PaymentMethodType.Cash)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      paymentMethodType === PaymentMethodType.Cash
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Banknote className='h-3.5 w-3.5' />
                    Наличные
                  </button>
                  <button
                    type='button'
                    onClick={() => setPaymentMethodType(PaymentMethodType.Card)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      paymentMethodType === PaymentMethodType.Card
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className='h-3.5 w-3.5' />
                    Карта
                  </button>
                </div>
              </div>
            )}

            {/* Driver section */}
            {(userRole === 'admin' || userRole === 'operator') && (
              <div>
                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>Водитель</p>
                <div className='space-y-2.5'>
                  <div>
                    <label className='text-xs text-slate-600 mb-1 block'>
                      Сумма водителя <span className='text-red-500'>*</span>
                    </label>
                    <div className='relative'>
                      <input
                        type='number'
                        placeholder='0'
                        value={driverPrice}
                        onChange={e => setDriverPrice(e.target.value)}
                        className='w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10'
                      />
                      <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400'>сом</span>
                    </div>
                  </div>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={useCustomPrice}
                      onChange={toggleCustomPrice}
                      className='rounded text-blue-600'
                    />
                    <span className='text-xs text-slate-600'>Задать цену вручную</span>
                  </label>
                  {useCustomPrice && (
                    <div className='relative'>
                      <input
                        type='number'
                        placeholder='0'
                        value={customPrice}
                        onChange={e => handleCustomPriceChange(e.target.value)}
                        className='w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 bg-blue-50'
                      />
                      <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400'>сом</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Operator notes */}
            {(userRole === 'admin' || userRole === 'operator') && (
              <div>
                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>Заметки оператора</p>
                <textarea
                  placeholder='Внутренние заметки...'
                  value={operatorNotes}
                  onChange={e => setOperatorNotes(e.target.value)}
                  rows={3}
                  className='w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                />
              </div>
            )}

            {/* Readiness checklist */}
            <div>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>Готовность</p>
              <div className='space-y-1.5'>
                {[
                  { label: 'Тариф выбран', done: !!selectedTariff, required: true, section: 'pricing' },
                  { label: 'Маршрут задан', done: !!(formData.startLocationId && formData.endLocationId), required: true, section: 'map' },
                  { label: 'Дата и время', done: !!(scheduleValid && formData.scheduledTime), required: true, section: 'schedule' },
                  { label: 'Пассажиры', done: passengersValid, required: true, section: 'passengers' },
                  ...(userRole === 'admin' || userRole === 'operator'
                    ? [{ label: 'Сумма водителя', done: !!driverPrice, required: true, section: '' }]
                    : []),
                ].map(({ label, done, required, section }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 ${section ? 'cursor-pointer' : ''}`}
                    onClick={() => section && toggleSection(section)}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      done ? 'bg-emerald-500' : required ? 'bg-red-100' : 'bg-slate-200'
                    }`}>
                      {done
                        ? <Check className='h-2.5 w-2.5 text-white' />
                        : required && <span className='text-red-500 text-[9px] font-bold leading-none'>!</span>
                      }
                    </div>
                    <span className={`text-xs ${done ? 'text-slate-700' : required ? 'text-red-500' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Submit button */}
          <div className='p-4 border-t border-slate-100 flex-shrink-0'>
            <Button
              type='button'
              onClick={handleSave}
              disabled={isSubmittingOrder || isAssigningDriver}
              className='w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm disabled:opacity-60'
            >
              {isAssigningDriver ? (
                <span className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Назначение водителя...
                </span>
              ) : isSubmittingOrder ? (
                <span className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  {isEditMode ? 'Обновление...' : 'Создание...'}
                </span>
              ) : (
                <span className='flex items-center gap-2'>
                  <Check className='h-4 w-4' />
                  {isEditMode ? 'Сохранить изменения' : 'Создать заказ'}
                </span>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}