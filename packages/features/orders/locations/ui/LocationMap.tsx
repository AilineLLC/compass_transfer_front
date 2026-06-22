'use client';

import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { LeafletMap } from '@shared/components/map';
import type { RoutePoint, ActiveDriverDTO, MapBounds } from '@shared/components/map/types';
import { Card, CardContent } from '@shared/ui/layout/card';
import type { GetLocationDTO } from '@entities/locations/interface';

interface LocationMapProps {
  // Координаты и точки карты
  mapCenter: { latitude: number; longitude: number };
  dynamicMapCenter: { latitude: number; longitude: number } | null;
  routePoints: RoutePoint[];
  mapLocations: GetLocationDTO[];
  
  // Состояния маршрута
  routeError: boolean;
  _routeLoading: boolean;
  
  // Состояния водителей
  activeDrivers: ActiveDriverDTO[];
  selectedDriverId?: string;
  openDriverPopupId?: string | null;
  showDriverSearchZone?: boolean;
  driverSearchRadius?: number;
  
  // Выбор локаций
  selectedLocationIds: string[];
  canSelectLocation?: (location: GetLocationDTO) => boolean;
  
  // Роль пользователя
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';
  
  // Колбэки
  onBoundsChange: (bounds: MapBounds) => void;
  onLocationToggle: (location: GetLocationDTO, isSelected: boolean) => void;
  onDriverSelect?: (driver: string | ActiveDriverDTO) => void;
  onRouteDistanceChange: (distance: number) => void;
  onRouteLegsChange?: (legs: { distance: number }[]) => void;
  getDriverById: (id: string) => Record<string, unknown> | null;
  loadDriverData: (id: string) => Promise<void>;
}

/**
 * Компонент карты для отображения маршрута и локаций
 */
export function LocationMap({
  mapCenter,
  dynamicMapCenter,
  routePoints,
  mapLocations,
  routeError,
  _routeLoading,
  activeDrivers,
  selectedDriverId,
  openDriverPopupId,
  showDriverSearchZone = false,
  driverSearchRadius = 1000,
  selectedLocationIds,
  canSelectLocation,
  userRole = 'operator',
  onBoundsChange,
  onLocationToggle,
  onDriverSelect,
  onRouteDistanceChange,
  onRouteLegsChange,
  getDriverById,
  loadDriverData
}: LocationMapProps) {
  // Преобразуем точки маршрута для карты с мемоизацией
  const mapRoutePoints = useMemo(() => {
    const validPoints = routePoints
      .filter(
        (point: RoutePoint) =>
          point.location &&
          typeof point.location.latitude === 'number' &&
          typeof point.location.longitude === 'number',
      )
      .map((point: RoutePoint) => ({
        latitude: point.location!.latitude,
        longitude: point.location!.longitude,
        name: point.location!.name,
        type: point.type === 'start' ? 'start' : point.type === 'end' ? 'end' : 'waypoint',
        id: point.location!.id,
      }));

    return validPoints;
  }, [routePoints]);

  return (
    <Card className='h-full'>
      <CardContent className='h-full p-4'>
        {/* Уведомление об ошибке маршрута */}
        {routeError && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4 text-red-600' />
            <div className='text-sm text-red-800'>
              <strong>Ошибка построения маршрута</strong>
              <p className='text-xs text-red-600 mt-1'>
                Не удалось построить маршрут по дорогам. Проверьте доступность API роутинга.
              </p>
            </div>
          </div>
        )}
        <div className='h-96 lg:h-full rounded-lg overflow-hidden'>
          <LeafletMap
            latitude={mapCenter.latitude}
            longitude={mapCenter.longitude}
            zoom={dynamicMapCenter ? 16 : (mapRoutePoints.length > 0 ? 12 : 11)}
            routePoints={mapRoutePoints as RoutePoint[]}
            showRoute={mapRoutePoints.length >= 2} // Показываем маршрут если есть минимум 2 точки
            showActiveDrivers
            onBoundsChange={onBoundsChange}
            mapLocations={mapLocations}
            selectedLocationIds={selectedLocationIds}
            onLocationToggle={onLocationToggle}
            canSelectLocation={canSelectLocation}
            onDriverSelect={onDriverSelect}
            selectedDriverId={selectedDriverId}
            openDriverPopupId={openDriverPopupId}
            dynamicCenter={dynamicMapCenter}
            onRouteDistanceChange={onRouteDistanceChange}
            onRouteLegsChange={onRouteLegsChange}
            activeDrivers={activeDrivers}
            getDriverById={getDriverById}
            loadDriverData={loadDriverData}
            // Для моментальных заказов показываем радиус поиска водителей
            showDriverSearchZone={showDriverSearchZone}
            driverSearchRadius={driverSearchRadius}
            userRole={userRole}
          />
        </div>
      </CardContent>
    </Card>
  );
}
