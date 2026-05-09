'use client';

import React, { useState } from 'react';
import { ScheduledRidesList } from '@features/active-ride';
import { OrderStackList } from '@features/order-stack';

export default function OrdersPage() {
  const [currentView, setCurrentView] = useState<'scheduled' | 'stack'>('scheduled');

  return (
    <div className='min-h-full bg-gray-50 p-4'>
      <div className='max-w-md mx-auto'>
        {/* Заголовок */}
        <div className='mb-7'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Мои заказы
          </h1>
          <p className='text-gray-600 mt-1'>
            Запланированные поездки и заказы в стакане
          </p>
        </div>

        {/* Переключатель вкладок */}
        <div className='flex mb-6 bg-gray-100 rounded-lg p-1'>
          <button
            onClick={() => setCurrentView('scheduled')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              currentView === 'scheduled'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Запланированные
          </button>
          <button
            onClick={() => setCurrentView('stack')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              currentView === 'stack'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Заказы в стакане
          </button>
        </div>

        {/* Контент */}
        <div className='transition-all duration-300'>
          {currentView === 'scheduled' && <ScheduledRidesList />}
          {currentView === 'stack' && <OrderStackList />}
        </div>
      </div>
    </div>
  );
}
