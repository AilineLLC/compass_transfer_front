'use client';

import L from 'leaflet';
import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { toast } from '@shared/lib/conditional-toast';
import { MapClickHandler } from '@shared/components/map/components';
import { MapSearch } from './components/map-search';

// Импортируем CSS стили Leaflet
import 'leaflet/dist/leaflet.css';

// Исправляем проблему с иконками маркеров в Leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Интерфейс для структурированного адреса
interface AddressData {
  fullAddress: string;
  country: string;
  region: string;
  city: string;
  street: string;
}


interface LeafletLocationMapProps {
  coordinates: [number, number] | null;
  onCoordinatesChange: (coordinates: [number, number]) => void;
  onAddressChange?: (addressData: AddressData) => void;
  initialAddress?: string; // Начальный адрес для режима редактирования
  height?: string;
  className?: string;
}

// Геокодер через API роут (без CORS проблем)
const getAddressByCoordinates = async (lat: number, lon: number): Promise<AddressData> => {
  try {
    const url = `/geocoding-proxy/reverse?lat=${lat}&lon=${lon}`;

    const response = await fetch(url);

    if (!response.ok) {
      toast.error(`Ошибка API при геокодировании: ${response.status}`);

      return {
        fullAddress: `Координаты: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        country: '',
        region: '',
        city: '',
        street: ''
      };
    }
    const data = await response.json();

    return data;
  } catch  {
    toast.error('Ошибка при запросе к API геокодирования:');

    return {
      fullAddress: `Координаты: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
      country: '',
      region: '',
      city: '',
      street: ''
    };
  }
};

// Компонент для управления картой без перерендера
const MapController: React.FC<{ coordinates: [number, number] | null }> = ({ coordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates && map) {
      // Получаем текущий зум карты
      const currentZoom = map.getZoom();

      // Плавно перемещаем карту к новым координатам, сохраняя текущий зум
      map.setView(coordinates, currentZoom, { animate: true });
    }
  }, [coordinates, map]);

  return null;
};

// Иконка маркера
const createMarkerIcon = (): L.DivIcon => {
  return L.divIcon({
    html: `<div style="
      background-color: #ef4444;
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      border: 2px solid white;
      transform: rotate(-45deg);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
};

export const LeafletLocationMap: React.FC<LeafletLocationMapProps> = ({
  coordinates,
  onCoordinatesChange,
  onAddressChange,
  initialAddress = '',
  height = '400px',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>(initialAddress);

  // Центр карты - Бишкек по умолчанию
  const center: [number, number] = coordinates || [42.856219, 74.603967];

  // Обработчик клика по карте
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const newCoordinates: [number, number] = [lat, lng];

    onCoordinatesChange(newCoordinates);

    if (onAddressChange) {
      setIsLoading(true);
      try {
        const addressData = await getAddressByCoordinates(lat, lng);

        setCurrentAddress(addressData.fullAddress);
        onAddressChange(addressData);
      } catch {
        toast.error('Ошибка получения адреса:');
        setCurrentAddress(`Координаты: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [onCoordinatesChange, onAddressChange]);

  // Обработчик выбора места из поиска
  const handleSearchSelect = useCallback(async (lat: number, lon: number, address: string) => {
    const newCoordinates: [number, number] = [lat, lon];

    onCoordinatesChange(newCoordinates);
    setCurrentAddress(address);

    if (onAddressChange) {
      // Получаем структурированный адрес
      try {
        const addressData = await getAddressByCoordinates(lat, lon);

        onAddressChange(addressData);
      } catch {
        toast.error('Ошибка получения структурированного адреса:');
        // Fallback - используем адрес из поиска
        onAddressChange({
          fullAddress: address,
          country: '',
          region: '',
          city: '',
          street: ''
        });
      }
    }
  }, [onCoordinatesChange, onAddressChange]);

  return (
    <div className={`relative ${className}`} style={{ height, width: '100%' }}>
      {/* Поиск */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <MapSearch onLocationSelect={handleSearchSelect} />
      </div>

      <MapContainer
        center={center}
        zoom={coordinates ? 15 : 10}
        style={{ height: '100%', width: '100%', minHeight: height }}
        className="rounded-md z-0"
        scrollWheelZoom
        doubleClickZoom
        dragging
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController coordinates={coordinates} />
        <MapClickHandler onMapClick={handleMapClick} />
        
        {coordinates && (
          <Marker position={coordinates} icon={createMarkerIcon()}>
            <Popup>
              <div className="text-sm max-w-xs">
                <div className="font-medium mb-1">Выбранная точка</div>
                <div className="text-gray-600 mb-2 text-xs">
                  {isLoading ? 'Получение адреса...' : currentAddress || 'Адрес не определен'}
                </div>
                <div className="text-xs text-gray-500">
                  <div>Широта: {coordinates[0].toFixed(6)}</div>
                  <div>Долгота: {coordinates[1].toFixed(6)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Информационная панель */}
      {coordinates && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-xs border">
          <div className="text-sm">
            <div className="font-medium text-gray-900 mb-1">Выбранная точка</div>
            <div className="text-gray-700 text-sm font-medium mb-2 break-words">
              {isLoading ? 'Получение адреса...' : currentAddress || 'Адрес не определен'}
            </div>
            <div className="text-gray-500 text-xs">
              <div>Широта: {coordinates[0].toFixed(6)}</div>
              <div>Долгота: {coordinates[1].toFixed(6)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
