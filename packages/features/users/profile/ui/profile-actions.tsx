'use client';

import { Lock, MessageCircle, ArrowLeft, Edit, Car } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useIsAdmin } from '@shared/contexts';
import { Button } from '@shared/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/layout/card';
import { LogoutButton } from '@features/auth';
import { ChangePasswordModal } from '@features/auth/ui/modal/change-password-modal';

interface ProfileActionsProps {
  hidePasswordChange?: boolean; // Скрыть кнопку смены пароля
  showBackButton?: boolean; // Показать кнопку "Назад"
  onBack?: () => void; // Обработчик кнопки "Назад"
  hideLogout?: boolean; // Скрыть кнопку "Выйти"
  // Для кнопки редактирования (только для админов)
  targetUserId?: string; // ID пользователя, которого просматриваем
  targetUserRole?: string; // Роль пользователя, которого просматриваем
  // Для управления автомобилями водителя (только для водителей)
  onManageDriverCars?: () => void; // Обработчик кнопки "Управление автомобилями"
}

export function ProfileActions({
  hidePasswordChange = false,
  showBackButton = false,
  onBack,
  hideLogout = false,
  targetUserId,
  targetUserRole,
  onManageDriverCars
}: ProfileActionsProps) {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const router = useRouter();
  const isAdmin = useIsAdmin();

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  const handleSendMessage = () => {};

  // Обработчик кнопки редактирования (только для админов)
  const handleEditUser = () => {
    if (targetUserId && targetUserRole) {
      // Преобразуем роль в нижний регистр для URL
      const roleForUrl = targetUserRole.toLowerCase();

      router.push(`/users/edit/${roleForUrl}/${targetUserId}`);
    }
  };

  // Показывать кнопку редактирования только админам и только если есть данные о целевом пользователе
  const showEditButton = isAdmin && targetUserId && targetUserRole;

  return (
    <div className='sticky top-4'>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Действия</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 px-4 pb-4'>
          {/* Кнопка редактирования (только для админов) */}
          {showEditButton && (
            <Button
              onClick={handleEditUser}
              className='w-full justify-start gap-2'
              variant='default'
            >
              <Edit className='h-4 w-4' />
              Редактировать профиль
            </Button>
          )}

          {/* Кнопка управления автомобилями (только для водителей) */}
          {targetUserRole === 'Driver' && onManageDriverCars && (
            <Button
              onClick={onManageDriverCars}
              className='w-full justify-start gap-2'
              variant='outline'
            >
              <Car className='h-4 w-4' />
              Управление автомобилями
            </Button>
          )}

          {!hidePasswordChange && (
            <Button
              onClick={handleChangePassword}
              className='w-full justify-start gap-2'
              variant='outline'
            >
              <Lock className='h-4 w-4' />
              Сменить пароль
            </Button>
          )}

          {/* <Button
            onClick={handleSendMessage}
            className='w-full justify-start gap-2'
            variant='outline'
          >
            <MessageCircle className='h-4 w-4' />
            Написать сообщение
          </Button> */}

          {!hideLogout && (
            <LogoutButton variant='destructive' className='w-full justify-start' />
          )}
          {showBackButton && (
            <Button
              onClick={onBack}
              className='w-full justify-start gap-2'
              variant='outline'
            >
              <ArrowLeft className='h-4 w-4' />
              Назад к списку
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно смены пароля */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
