'use client';

import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface MapSearchProps {
  onLocationSelect: (lat: number, lon: number, address: string) => void;
  className?: string;
}

export const MapSearch: React.FC<MapSearchProps> = ({
  onLocationSelect,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Поиск через Nominatim API
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/geocoding-proxy/search?q=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.slice(0, 5)); // Показываем только первые 5 результатов
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик изменения поискового запроса
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    // Дебаунс для поиска
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  // Обработчик выбора результата
  const handleResultSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    setQuery(result.display_name);
    setIsOpen(false);
    setResults([]);
    
    onLocationSelect(lat, lon, result.display_name);
  };

  // Очистка поиска
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Поисковое поле */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Поиск адреса или места..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Результаты поиска */}
      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-[1001] max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              Поиск...
            </div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleResultSelect(result)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              >
                <div className="text-sm text-gray-900 truncate">
                  {result.display_name}
                </div>
              </button>
            ))
          ) : query ? (
            <div className="p-3 text-center text-gray-500">
              Ничего не найдено
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
