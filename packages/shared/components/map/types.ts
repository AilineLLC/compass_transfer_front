import type { VehicleType, ServiceClass } from '@entities/cars/enums';
import type { GetLocationDTO } from '@entities/locations/interface';

/**
 * Типы маршрутов для выбора пользователем
 */
export enum RouteType {
  FASTEST = 'fastest', // Быстрый маршрут (приоритет скорости)
  SHORTEST = 'shortest', // Кратчайший маршрут (минимальное расстояние)
  BALANCED = 'short_fastest', // Сбалансированный (компромисс между скоростью и расстоянием)
  ECO = 'eco', // Экономичный (экономия топлива)
}

/**
 * Метаданные для типов маршрутов
 */
export interface RouteTypeInfo {
  type: RouteType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Результат построения маршрута с метаданными
 */
export interface RouteResult {
  type: RouteType;
  coordinates: [number, number][];
  distance: number; // в метрах
  duration: number; // в секундах
  info: RouteTypeInfo;
  legs?: { distance: number }[]; // расстояние каждого сегмента в метрах
}

/**
 * Интерфейс для активного водителя с геолокацией
 */
export interface ActiveDriverDTO {
  id: string;
  type: VehicleType;
  serviceClass: ServiceClass;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Интерфейс для точки маршрута
 */
export interface RoutePoint {
  latitude: number;
  longitude: number;
  name?: string;
  type?: 'start' | 'end' | 'driver' | 'waypoint' | 'intermediate';
  id?: string; // Добавляем опциональный ID для локаций
  heading?: number; // Направление движения для водителя
  // Дополнительные поля для форм заказов
  location?: GetLocationDTO | null; // Полная информация о локации
  label?: string; // Метка для отображения в форме
}

/**
 * Интерфейс для границ карты
 */
export interface MapBounds {
  latFrom: number;
  latTo: number;
  longFrom: number;
  longTo: number;
}

/**
 * Интерфейс для локации в контексте выбора маршрута
 */
export interface RouteLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

/**
 * Основные пропсы компонента LeafletMap
 */
export interface LeafletMapProps {
  /** Широта центра карты */
  latitude: number;
  /** Долгота центра карты */
  longitude: number;
  /** Уровень зума */
  zoom?: number;
  /** Высота карты */
  height?: string;
  /** Ширина карты */
  width?: string;
  /** Показать маркер */
  showMarker?: boolean;
  /** Текст в popup маркера */
  markerText?: string;
  /** Точки маршрута */
  routePoints?: RoutePoint[];
  /** Показать маршрут между точками */
  showRoute?: boolean;
  /** Активные водители для отображения на карте */
  activeDrivers?: ActiveDriverDTO[];
  /** Показать активных водителей */
  showActiveDrivers?: boolean;
  /** Дополнительные CSS классы */
  className?: string;
  /** Обработчик клика по карте */
  onMapClick?: (lat: number, lng: number) => void;
  /** Обработчик изменения границ карты для загрузки водителей */
  onBoundsChange?: (bounds: MapBounds) => void;
  /** Обработчик выбора водителя с карты */
  onDriverSelect?: (driver: ActiveDriverDTO | string) => void;
  /** ID выбранного водителя для отображения состояния кнопки */
  selectedDriverId?: string;
  /** ID водителя для автоматического открытия попапа */
  openDriverPopupId?: string | null;
  /** Локации в пределах карты (не выбранные) */
  mapLocations?: GetLocationDTO[];
  /** Список ID выбранных локаций */
  selectedLocationIds?: string[];
  /** Callback для выбора/снятия выбора локации */
  onLocationToggle?: (location: GetLocationDTO, isSelected: boolean) => void;
  /** Функция для определения возможности выбора локации */
  canSelectLocation?: (location: GetLocationDTO) => boolean;
  /** Функция для получения полных данных водителя по ID */
  getDriverById?: (id: string) => Record<string, unknown> | null;
  /** Функция для загрузки данных водителя */
  loadDriverData?: (id: string) => Promise<void>;
  /** Динамический центр карты для программного перемещения */
  dynamicCenter?: { latitude: number; longitude: number } | null;
  /** Показать зону поиска водителей (для мгновенных заказов) */
  showDriverSearchZone?: boolean;
  /** Радиус зоны поиска в метрах (по умолчанию 2000м = 2км) */
  driverSearchRadius?: number;
  /** Локации для выбора маршрута */
  locations?: RouteLocation[];
  /** Выбранная начальная локация */
  selectedStartLocation?: RouteLocation | null;
  /** Выбранная конечная локация */
  selectedEndLocation?: RouteLocation | null;
  /** Обработчик выбора локации */
  onLocationSelect?: (location: RouteLocation) => void;
  /** Режим выбора начальной точки */
  isSelectingStart?: boolean;
  /** Текущая позиция водителя для проверки отклонения от маршрута */
  currentDriverLocation?: { latitude: number; longitude: number };
  /** Максимальное расстояние отклонения от маршрута в метрах (по умолчанию 100м) */
  routeDeviationThreshold?: number;
  /** Callback для уведомления об отклонении от маршрута */
  onRouteDeviation?: (isOffRoute: boolean, distance?: number) => void;
  /** Callback для передачи расстояния маршрута в метрах */
  onRouteDistanceChange?: (distance: number) => void;
  /** Callback для передачи расстояний по сегментам маршрута */
  onRouteLegsChange?: (legs: { distance: number }[]) => void;
  /** Роль пользователя для скрытия кнопок выбора водителя */
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';
}
