'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LocationType } from '@entities/locations/enums';
import type { GetLocationDTO } from '@entities/locations/interface';
import { createDriverIcon, createPinIcon, getColorByType } from '../icons';
import type { RoutePoint } from '../types';

interface RouteMarkerProps {
  point: RoutePoint;
  index: number;
  routePoints: RoutePoint[];
  onLocationToggle?: (location: GetLocationDTO, isSelected: boolean) => void;
  uiScale?: number;
}

/**
 * Компонент маркера точки маршрута
 */
export const RouteMarker: React.FC<RouteMarkerProps> = ({
  point,
  index,
  routePoints,
  onLocationToggle,
  uiScale = 1,
}) => {
  // Для водителя используем специальную иконку машинки
  if (point.type === 'driver') {
    const heading = 'heading' in point ? (point.heading as number) : 0;

    return (
      <Marker
        key={`driver-${index}`}
        position={[point.latitude, point.longitude]}
        icon={createDriverIcon('Economy', false, heading, uiScale)}
      >
        <Popup>
          <div style={{ minWidth: '12.5rem' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
              🚗 Мое местоположение
            </div>
            <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              <div>
                <strong>Координаты:</strong> {point.latitude.toFixed(6)},{' '}
                {point.longitude.toFixed(6)}
              </div>
              {heading > 0 && (
                <div>
                  <strong>Направление:</strong> {heading.toFixed(0)}°
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }

  // start = A, end = B (всегда), промежуточные = 1, 2, 3...
  let label: string;

  if (point.type === 'start') {
    label = 'A';
  } else if (point.type === 'end') {
    label = 'B';
  } else {
    const waypointsBefore = routePoints
      .slice(0, index)
      .filter(p => p.type !== 'driver' && p.type !== 'start' && p.type !== 'end').length;

    label = String(waypointsBefore + 1); // 1, 2, 3...
  }

  const colorFill = getColorByType(point.type);

  // Проверяем, есть ли у точки маршрута ID (значит это локация, а не просто координаты)
  const hasLocationId = 'id' in point && point.id;

  return (
    <Marker
      key={index}
      position={[point.latitude, point.longitude]}
      icon={createPinIcon(colorFill, label, uiScale)}
    >
      <Popup>
        <div style={{ minWidth: '12.5rem' }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
            {point.name || `Точка ${index + 1}`}
          </div>
          <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            <div>
              <strong>Тип:</strong> {point.type || 'Неизвестно'}
            </div>
            <div>
              <strong>Координаты:</strong> {point.latitude.toFixed(6)},{' '}
              {point.longitude.toFixed(6)}
            </div>
          </div>

          {/* Кнопка удаления для точек маршрута с ID локации */}
          {hasLocationId && onLocationToggle && (
            <button
              type='button'
              onClick={() => {
                // Создаем минимальный объект GetLocationDTO для удаления
                const locationToRemove: GetLocationDTO = {
                  id: point.id!,
                  name: point.name || 'Точка',
                  latitude: point.latitude,
                  longitude: point.longitude,
                  address: point.name || 'Точка',
                  city: '',
                  country: '',
                  region: '',
                  type: LocationType.Other,
                  isActive: true,
                };

                onLocationToggle(locationToRemove, false); // false = убрать
              }}
              style={{
                width: '100%',
                padding: '0.375rem 0.75rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = '#ef4444';
              }}
            >
              ❌ Убрать точку
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
