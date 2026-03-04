import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { locationsApi } from '@shared/api/locations';
import { Button } from '@shared/ui/forms/button';
import { LocationType } from '@entities/locations/enums';
import type { LocationDTO } from '@entities/locations/interface/LocationDTO';

export interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (locationId: string) => void;
}

export function LocationSelectionModal({ isOpen, onClose, onLocationSelect }: LocationSelectionModalProps) {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        const response = await locationsApi.getLocations({
          type: [LocationType.Other],
          isActive: true,
          size: 100,
          sortBy: 'name',
          sortOrder: 'Asc'
        });

        setLocations(response.data);
      } catch {
        // В production здесь можно добавить логирование ошибки
        setError('Не удалось загрузить список стартовых точек');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [isOpen]);

  const handleSelect = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647,
        WebkitTransform: 'translate3d(0,0,0)',
        transform: 'translate3d(0,0,0)',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden'
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          WebkitTransform: 'translate3d(0,0,0)',
          transform: 'translate3d(0,0,0)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            Выберите стартовую точку
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : locations.length === 0 ? (
            <div className="text-gray-500 text-center py-4">Нет доступных стартовых точек</div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedLocation === location.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  onClick={() => setSelectedLocation(location.id)}
                >
                  <h3 className="font-medium text-gray-900">{location.name}</h3>
                  <p className="text-sm text-gray-600">{location.address}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedLocation || isLoading}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
          >
            Выбрать
          </Button>
        </div>
      </div>
    </div>
  );
}