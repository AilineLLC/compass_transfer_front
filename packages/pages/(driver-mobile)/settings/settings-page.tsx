'use client';

import { User, Shield, HelpCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { logger } from '@shared/lib';
import { ChangePasswordModal } from "@features/auth/ui/modal/change-password-modal"
import { apiPost } from '@shared/api';
import { MyCarsSection } from './my-cars-section';

export default function SettingsPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Вызываем API route для очистки куки
      const logoutResponse = await apiPost('/Auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).then(() => {
        window.location.href = '/login';
      }).catch(() => {
        logger.error('Ошибка при выходе из системы');
      })

      return logoutResponse
    } catch (error) {
      logger.error('Ошибка при выходе:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className='min-h-full bg-gray-50 p-4'>
      <div className='max-w-md mx-auto'>
        {/* Заголовок */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center'>
            Настройки
          </h1>
        </div>

        {/* Группы настроек */}
        <div className='space-y-4'>
          {/* Профиль */}
          <div className='bg-white rounded-2xl shadow-sm'>
            <div className='p-4 border-b border-gray-100'>
              <h2 className='text-lg font-semibold text-gray-900'>Профиль</h2>
            </div>
            <div className='p-4 space-y-3'>
              <Link href="/profile">
                <div className='flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer'>
                  <User className='w-5 h-5 text-gray-600' />
                  <span className='text-gray-900'>Личные данные</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Мои автомобили */}
          <MyCarsSection />

          {/* Безопасность */}
          <div className='bg-white rounded-2xl shadow-sm'>
            <div className='p-4 border-b border-gray-100'>
              <h2 className='text-lg font-semibold text-gray-900'>Безопасность</h2>
            </div>
            <div className='p-4 space-y-3'>
              <div
                onClick={() => setIsPasswordModalOpen(true)}
                className='flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer'
              >
                <Shield className='w-5 h-5 text-gray-600' />
                <span className='text-gray-900'>Изменить пароль</span>
              </div>
              {isPasswordModalOpen && (<ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />)}
            </div>
          </div>

          {/* Выход */}
          <div className='bg-white rounded-2xl shadow-sm mb-[70px]'>
            <div className='p-4'>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className='w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isLoggingOut ? (
                  <div className='w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin' />
                ) : (
                  <LogOut className='w-5 h-5 text-red-600' />
                )}
                <span className='text-red-600 font-medium'>
                  {isLoggingOut ? 'Выход...' : 'Выйти из аккаунта'}
                </span>
              </button>
            </div>
          </div>

          {/* Помощь */}
          <div className='bg-white rounded-2xl shadow-sm'>
            <div className='p-4 border-b border-gray-100'>
              <h2 className='text-lg font-semibold text-gray-900'>Помощь</h2>
            </div>
            <div className='p-4 space-y-3'>
              <div className='flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer'>
                <HelpCircle className='w-5 h-5 text-gray-600' />
                <span className='text-gray-900'>Поддержка</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
