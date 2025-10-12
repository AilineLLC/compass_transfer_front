'use client';

import {
  Car,
  Users,
  Star,
  Shield,
  Zap,
  Snowflake,
  Sun,
  Volume2,
  Camera,
  ParkingCircle,
  Navigation,
  Bluetooth,
  Wifi,
  Circle,
  Settings
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SimpleTooltip } from '@shared/ui/modals/tooltip';
import { CarFeature, type CarColor } from '@entities/cars/enums';
import { CarColorTranslations } from '@entities/cars/enums/CarColor.enum';
import type { GetCarDTO } from '@entities/cars/interface';
import { CarTypeValues } from '@entities/tariffs/enums/CarType.enum';
import { ServiceClassValues } from '@entities/tariffs/enums/ServiceClass.enum';

interface PremiumCarShowcaseProps {
  cars: GetCarDTO[];
  isLoading?: boolean;
  tariffName?: string;
  cardWidth?: number; // Ширина карточки в пикселях
  userRole?: 'admin' | 'operator' | 'partner' | 'driver'; // Роль пользователя
}

export function PremiumCarShowcase({ cars, isLoading, tariffName, cardWidth = 1024, userRole }: PremiumCarShowcaseProps) {
  const router = useRouter();

  const handleCarDetails = (carId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`http://compass.local:3009/cars/${carId}`);
  };

  const scrollToCard = (index: number) => {
    const container = document.querySelector('[data-cars-container]');
    
    if (container) {
      const totalCardWidth = cardWidth + 24; // ширина карточки + gap

      container.scrollTo({
        left: index * totalCardWidth,
        behavior: 'smooth'
      });
    }
  };

  const getFeatureIcon = (feature: CarFeature) => {
    const icons = {
      [CarFeature.AirConditioning]: <Snowflake className='h-5 w-5' />,
      [CarFeature.ClimateControl]: <Sun className='h-5 w-5' />,
      [CarFeature.LeatherSeats]: <Star className='h-5 w-5' />,
      [CarFeature.HeatedSeats]: <Zap className='h-5 w-5' />,
      [CarFeature.Bluetooth]: <Bluetooth className='h-5 w-5' />,
      [CarFeature.USBPort]: <Zap className='h-5 w-5' />,
      [CarFeature.AuxInput]: <Volume2 className='h-5 w-5' />,
      [CarFeature.Navigation]: <Navigation className='h-5 w-5' />,
      [CarFeature.BackupCamera]: <Camera className='h-5 w-5' />,
      [CarFeature.ParkingSensors]: <ParkingCircle className='h-5 w-5' />,
      [CarFeature.Sunroof]: <Sun className='h-5 w-5' />,
      [CarFeature.PanoramicRoof]: <Sun className='h-5 w-5' />,
      [CarFeature.ThirdRowSeats]: <Users className='h-5 w-5' />,
      [CarFeature.ChildSeat]: <Shield className='h-5 w-5' />,
      [CarFeature.WheelchairAccess]: <Shield className='h-5 w-5' />,
      [CarFeature.Wifi]: <Wifi className='h-5 w-5' />,
      [CarFeature.PremiumAudio]: <Volume2 className='h-5 w-5' />,
      [CarFeature.AppleCarplay]: <Settings className='h-5 w-5' />,
      [CarFeature.AndroidAuto]: <Settings className='h-5 w-5' />,
      [CarFeature.SmokingAllowed]: <Circle className='h-5 w-5' />,
      [CarFeature.PetFriendly]: <Star className='h-5 w-5' />,
      [CarFeature.LuggageCarrier]: <Settings className='h-5 w-5' />,
      [CarFeature.BikeRack]: <Settings className='h-5 w-5' />
    };

    return icons[feature] || <Settings className='h-5 w-5' />;
  };

  const getFeatureName = (feature: CarFeature): string => {
    const featureNames = {
      [CarFeature.AirConditioning]: 'Кондиционер',
      [CarFeature.ClimateControl]: 'Климат-контроль',
      [CarFeature.LeatherSeats]: 'Кожаные сиденья',
      [CarFeature.HeatedSeats]: 'Подогрев сидений',
      [CarFeature.Bluetooth]: 'Bluetooth',
      [CarFeature.USBPort]: 'USB-порт',
      [CarFeature.AuxInput]: 'AUX-вход',
      [CarFeature.Navigation]: 'Навигация',
      [CarFeature.BackupCamera]: 'Камера заднего вида',
      [CarFeature.ParkingSensors]: 'Парктроник',
      [CarFeature.Sunroof]: 'Люк',
      [CarFeature.PanoramicRoof]: 'Панорамная крыша',
      [CarFeature.ThirdRowSeats]: 'Третий ряд сидений',
      [CarFeature.ChildSeat]: 'Детское кресло',
      [CarFeature.WheelchairAccess]: 'Доступ для инвалидов',
      [CarFeature.Wifi]: 'Wi-Fi',
      [CarFeature.PremiumAudio]: 'Премиум аудио',
      [CarFeature.AppleCarplay]: 'Apple CarPlay',
      [CarFeature.AndroidAuto]: 'Android Auto',
      [CarFeature.SmokingAllowed]: 'Разрешено курение',
      [CarFeature.PetFriendly]: 'Можно с животными',
      [CarFeature.LuggageCarrier]: 'Багажник на крыше',
      [CarFeature.BikeRack]: 'Крепление для велосипедов'
    };

    return featureNames[feature] || feature;
  };

  if (isLoading) {
    return (
      <div className='bg-white rounded-3xl shadow-2xl overflow-hidden'>
        <div className='animate-pulse'>
          <div className='h-96 bg-gray-200' />
          <div className='p-8'>
            <div className='h-8 bg-gray-200 rounded mb-4' />
            <div className='h-4 bg-gray-200 rounded mb-2' />
            <div className='h-4 bg-gray-200 rounded w-3/4' />
          </div>
        </div>
      </div>
    );
  }

  if (!cars.length) {
    return (
      <div className='space-y-8'>
        <div className='relative'>
          <div
            className='flex gap-6 overflow-x-auto p-8'
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div
              className='relative flex-shrink-0 h-[500px] rounded-3xl overflow-hidden bg-gray-100 flex items-center justify-center'
              style={{ width: `${cardWidth}px` }}
            >
              <div className='text-center'>
                <Car className='h-24 w-24 text-gray-300 mx-auto mb-6' />
                <h3 className='text-2xl font-bold text-gray-900 mb-2'>Автомобили не найдены</h3>
                <p className='text-gray-600'>
                  {tariffName ? `Нет доступных автомобилей для тарифа "${tariffName}"` : 'Нет доступных автомобилей'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Слайдер карточек в стиле Tesla */}
      <div className='relative'>
        <div
          data-cars-container
          className='flex gap-6 overflow-x-auto'
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {cars.map((car, index) => (
            <div
              key={car.id}
              onClick={() => scrollToCard(index)}
              className='relative flex-shrink-0 h-[500px] rounded-3xl overflow-hidden shadow-lg cursor-pointer'
              style={{ width: `${cardWidth}px` }}
            >
              {/* Фоновое изображение */}
              <div className='absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200'>
                <Image
                  src='/auto/eqm5_black.png'
                  alt={`${car.make} ${car.model}`}
                  fill
                  className='object-cover transition-all duration-300 hover:scale-110'
                />

                {/* Градиентный оверлей */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
              </div>

              {/* Тип автомобиля в верхнем левом углу */}
              <div className='absolute top-6 left-6'>
                <span className='bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium'>
                  {CarTypeValues[car.type as unknown as keyof typeof CarTypeValues] || car.type}
                </span>
              </div>

              {/* Статус в верхнем правом углу */}
              <div className='absolute top-6 right-6'>
                <div className='bg-green-500 w-3 h-3 rounded-full' />
              </div>

              {/* Информация внизу карточки */}
              <div className='absolute bottom-0 left-0 right-0 p-6 text-white'>
                <h3 className='text-2xl font-bold mb-2'>
                  {car.make} {car.model}
                </h3>
                <p className='text-white/90 mb-4'>
                  {car.year} • {CarColorTranslations[car.color as CarColor] || car.color}
                </p>

                {/* Характеристики */}
                <div className='flex items-center gap-4 mb-4'>
                  <div className='flex items-center gap-1'>
                    <Users className='h-4 w-4' />
                    <span className='text-sm'>{car.passengerCapacity}</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Star className='h-4 w-4' />
                    <span className='text-sm'>
                      {ServiceClassValues[car.serviceClass as keyof typeof ServiceClassValues] || car.serviceClass}
                    </span>
                  </div>
                </div>

                {/* Оснащение и кнопка "Подробнее" на одной линии */}
                <div className='flex items-center justify-between'>
                  {/* Оснащение слева */}
                  <div className='flex flex-wrap gap-2'>
                    {car.features.slice(0, 6).map((feature, index) => (
                      <SimpleTooltip key={index} content={getFeatureName(feature)} side='top' variant='premium'>
                        <div className='p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors cursor-help'>
                          {getFeatureIcon(feature)}
                        </div>
                      </SimpleTooltip>
                    ))}
                    {car.features.length > 6 && (
                      <SimpleTooltip content={`+${car.features.length - 6} дополнительных опций`} side='top' variant='premium'>
                        <div className='p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors cursor-help flex items-center justify-center'>
                          <span className='text-sm font-medium'>+{car.features.length - 6}</span>
                        </div>
                      </SimpleTooltip>
                    )}
                  </div>

                  {/* Кнопка "Подробнее" справа - только для админов и операторов */}
                  {userRole !== 'partner' && (
                    <button
                      onClick={(e) => handleCarDetails(car.id, e)}
                      className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm ml-4'
                    >
                      Подробнее
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Индикаторы слайдов для прокрутки */}
      {cars.length > 1 && (
        <div className='flex justify-center gap-2'>
          {cars.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              className='w-3 h-3 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors'
            />
          ))}
        </div>
      )}
    </div>
  );
}
