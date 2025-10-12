'use client';

import { Car, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PromoBannersProps {
  userRole?: 'admin' | 'operator' | 'partner' | 'driver';
}

export function PromoBanners({ userRole = 'operator' }: PromoBannersProps) {
  const router = useRouter();

  const handleCarsClick = () => {
    router.push('/cars');
  };

  const handleTariffsClick = () => {
    router.push('/tariffs');
  };

  // Показываем баннер автопарка только для админов и операторов
  const showCarsBanner = userRole === 'admin' || userRole === 'operator' || userRole === 'partner';

  return (
    <div className={`grid grid-cols-1 ${showCarsBanner ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
      {/* Первый баннер - Автомобили (только для админов и операторов) */}
      {showCarsBanner && (
      <div 
        onClick={handleCarsClick}
        className='relative bg-gradient-to-r from-gray-100 to-blue-50 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden group'
      >
        {/* Фоновый паттерн */}
        <div className='absolute inset-0 opacity-5'>
          <div className='absolute top-4 right-4 w-32 h-32 bg-blue-500 rounded-full blur-3xl' />
          <div className='absolute bottom-4 left-4 w-24 h-24 bg-gray-500 rounded-full blur-2xl' />
        </div>

        <div className='relative z-10 flex items-center justify-between'>
          <div className='flex-1'>
            <h3 className='text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors'>
              Наш автопарк
            </h3>
            <p className='text-gray-600 mb-4'>
              Широкий выбор автомобилей. Найдите идеальный вариант для пассажира
            </p>
            <div className='flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all'>
              <span>Посмотреть все</span>
              <ArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform' />
            </div>
          </div>

          <div className='relative w-32 h-20 ml-6'>
            {/* Иконка автомобилей */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='relative'>
                <Car className='h-16 w-16 text-blue-500 group-hover:scale-110 transition-transform' />
                <div className='absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center'>
                  <span className='text-white text-xs font-bold'>+</span>
                </div>
              </div>
            </div>
            
            {/* Декоративные элементы */}
            <div className='absolute top-2 left-2 w-3 h-3 bg-blue-300 rounded-full opacity-60 group-hover:scale-125 transition-transform' />
            <div className='absolute bottom-2 right-2 w-2 h-2 bg-gray-400 rounded-full opacity-40 group-hover:scale-150 transition-transform' />
          </div>
        </div>
      </div>
      )}

      {/* Второй баннер - Тарифы */}
      <div 
        onClick={handleTariffsClick}
        className='relative bg-gradient-to-r from-purple-50 to-indigo-100 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden group'
      >
        {/* Фоновый паттерн */}
        <div className='absolute inset-0 opacity-5'>
          <div className='absolute top-4 left-4 w-28 h-28 bg-purple-500 rounded-full blur-3xl' />
          <div className='absolute bottom-4 right-4 w-20 h-20 bg-indigo-500 rounded-full blur-2xl' />
        </div>

        <div className='relative z-10 flex items-center justify-between'>
          <div className='flex-1'>
            <h3 className='text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors'>
              Умные тарифы
            </h3>
            <p className='text-gray-600 mb-4'>
              Гибкая система тарификации. Выберите оптимальный план поездки
            </p>
            <div className='flex items-center gap-2 text-purple-600 font-medium group-hover:gap-3 transition-all'>
              <span>Список тарифов</span>
              <ArrowRight className='h-4 w-4 group-hover:translate-x-1 transition-transform' />
            </div>
          </div>

          <div className='relative w-32 h-20 ml-6'>
            {/* Иконка тарифов */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='relative'>
                <Zap className='h-16 w-16 text-purple-500 group-hover:scale-110 transition-transform' />
                <div className='absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center'>
                  <span className='text-white text-xs font-bold'>AI</span>
                </div>
              </div>
            </div>
            
            {/* Декоративные элементы */}
            <div className='absolute top-2 right-2 w-3 h-3 bg-purple-300 rounded-full opacity-60 group-hover:scale-125 transition-transform' />
            <div className='absolute bottom-2 left-2 w-2 h-2 bg-indigo-400 rounded-full opacity-40 group-hover:scale-150 transition-transform' />
            
            {/* Дополнительные искры */}
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
              <div className='w-1 h-1 bg-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity' />
            </div>
          </div>
        </div>

        {/* Анимированный градиент при hover */}
        <div className='absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
      </div>
    </div>
  );
}
