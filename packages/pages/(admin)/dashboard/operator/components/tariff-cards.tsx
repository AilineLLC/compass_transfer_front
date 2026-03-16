'use client';

import { Car, Clock, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { tariffsApi, type GetTariffDTOWithArchived } from '@shared/api/tariffs';
import { CarTypeValues } from '@entities/tariffs/enums/CarType.enum';
import { ServiceClassValues, ServiceClassColors } from '@entities/tariffs/enums/ServiceClass.enum';

interface TariffCardsProps {
  onTariffClick?: (tariff: GetTariffDTOWithArchived) => void;
  onFirstTariffLoaded?: (tariff: GetTariffDTOWithArchived) => void;
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';
}

export function TariffCards({ onTariffClick, onFirstTariffLoaded, userRole }: TariffCardsProps) {
  const router = useRouter();
  const [tariffs, setTariffs] = useState<GetTariffDTOWithArchived[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTariffIndex, setSelectedTariffIndex] = useState(0);
  const isFirstLoadRef = useRef(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadTariffs = async () => {
      try {
        setIsLoading(true);
        setError(null)
        
        const response = await tariffsApi.getTariffs({
          archived: false,
          size: 6,
          first: true,
          sortBy: 'basePrice',
          sortOrder: 'Asc'
        });

        setTariffs(response.data);

        // Автоматически выбираем первый тариф только при первой загрузке
        if (response.data.length > 0 && onFirstTariffLoaded && isFirstLoadRef.current) {
          onFirstTariffLoaded(response.data[0]);
          isFirstLoadRef.current = false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки тарифов');
      } finally {
        setIsLoading(false);
      }
    };

    loadTariffs();
  }, []); // Убираем зависимость от onFirstTariffLoaded





  const handleTariffSelect = (index: number) => {
    setSelectedTariffIndex(index);

    // Скроллим к выбранной карточке
    if (sliderRef.current) {
      const cardWidth = 400; // ширина карточки
      const gap = 24; // gap-6 = 24px
      const scrollPosition = index * (cardWidth + gap);

      sliderRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleTariffClick = (tariff: GetTariffDTOWithArchived) => {
    onTariffClick?.(tariff);
  };



  if (isLoading) {
    return (
      <div className='space-y-8'>
        {/* Слайдер скелетонов */}
        <div className='relative'>
          <div
            className='flex gap-6 overflow-x-auto p-8 [&::-webkit-scrollbar]:hidden'
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='relative flex-shrink-0 w-[400px] h-[500px] rounded-3xl overflow-hidden bg-gray-200 animate-pulse'>
                <div className='absolute top-6 left-6 bg-gray-300 rounded-full px-3 py-1 w-24 h-6' />
                <div className='absolute top-6 right-6 bg-gray-300 w-3 h-3 rounded-full' />
                <div className='absolute bottom-0 left-0 right-0 p-6'>
                  <div className='bg-gray-300 h-8 w-32 mb-2 rounded' />
                  <div className='bg-gray-300 h-4 w-24 mb-4 rounded' />
                  <div className='flex gap-3'>
                    <div className='bg-gray-300 h-10 flex-1 rounded-lg' />
                    <div className='bg-gray-300 h-10 w-20 rounded-lg' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='mb-6'>
        <div className='text-center py-8'>
          <p className='text-red-600 mb-2'>Ошибка загрузки тарифов</p>
          <p className='text-sm text-muted-foreground'>{error}</p>
        </div>
      </div>
    );
  }

  if (tariffs.length === 0) {
    return (
      <div className='mb-6'>
        <div className='text-center py-8'>
          <Car className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <p className='text-muted-foreground'>Нет доступных тарифов</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Слайдер карточек тарифов в стиле Tesla */}
      <div className='relative'>
        <div
          ref={sliderRef}
          className='flex gap-6 overflow-x-auto py-6 px-3 [&::-webkit-scrollbar]:hidden'
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {tariffs.map((tariff, index) => (
            <div
              key={tariff.id}
              onClick={() => handleTariffSelect(index)}
              className={`relative flex-shrink-0 w-[400px] h-[500px] rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${
                index === selectedTariffIndex
                  ? 'transform scale-105'
                  : 'hover:transform hover:scale-[1.02]'
              }`}
            >
              {/* Фоновое изображение */}
              <div className={`absolute inset-0 transition-colors duration-300 ${
                index === selectedTariffIndex
                  ? 'bg-gradient-to-br from-blue-200 to-purple-300'
                  : 'bg-gradient-to-br from-blue-100 to-purple-200'
              }`}>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <Image
                    src='/auto/eqm5_black.png'
                    alt={tariff.name}
                    width={300}
                    height={200}
                    className={`object-contain transition-opacity duration-300 ${
                      index === selectedTariffIndex ? 'opacity-100' : 'opacity-30'
                    }`}
                  />
                </div>

                {/* Градиентный оверлей - убираем для активной карточки */}
                {index !== selectedTariffIndex && (
                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
                )}
              </div>

              {/* Класс тарифа в верхнем левом углу */}
              <div className='absolute top-6 left-6'>
                <span className={`${ServiceClassColors[tariff.serviceClass as keyof typeof ServiceClassColors] || 'bg-gray-500 text-white'} backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-lg`}>
                  {ServiceClassValues[tariff.serviceClass as keyof typeof ServiceClassValues] || tariff.serviceClass}
                </span>
              </div>

              {/* Статус в верхнем правом углу */}
              <div className='absolute top-6 right-6'>
                <div className='bg-green-500 w-3 h-3 rounded-full' />
              </div>

              {/* Информация внизу карточки */}
              <div className={`absolute bottom-0 left-0 right-0 p-6 ${
                index === selectedTariffIndex ? 'text-gray-900' : 'text-white'
              }`}>
                <h3 className='text-2xl font-bold mb-2'>
                  {tariff.name}
                </h3>
                <p className={`mb-4 ${
                  index === selectedTariffIndex ? 'text-gray-700' : 'text-white/90'
                }`}>
                  {CarTypeValues[tariff.carType as keyof typeof CarTypeValues] || tariff.carType} • {tariff.basePrice} сом базовая цена
                </p>

                {/* Характеристики */}
                {
                  userRole !== 'partner' && 
                  <div className='flex items-center gap-4 mb-4'>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-4 w-4' />
                      <span className='text-sm'>{tariff.minutePrice} сом/мин</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <DollarSign className='h-4 w-4' />
                      <span className='text-sm'>{tariff.perKmPrice} сом/км</span>
                    </div>
                  </div>
                }

                {/* Кнопка действия */}
                <div className='flex'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      // Для админов и операторов - переход на страницу просмотра тарифа
                      if (userRole === 'admin' || userRole === 'operator') {
                        router.push(`/tariffs/${tariff.id}`);
                      } else {
                        // Для партнеров - выбор тарифа для заказа
                        handleTariffClick(tariff);
                      }
                    }}
                    className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full'
                  >
                    {userRole === 'admin' || userRole === 'operator' ? 'Просмотр' : 'Выбрать тариф'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>

      {/* Индикаторы слайдов */}
      {tariffs.length > 1 && (
        <div className='flex justify-center gap-2'>
          {tariffs.map((_, index) => (
            <button
              key={index}
              onClick={() => handleTariffSelect(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === selectedTariffIndex
                  ? 'bg-blue-600 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
