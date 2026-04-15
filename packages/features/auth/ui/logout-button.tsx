'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { logger } from '@shared/lib';
import { Button } from '@shared/ui/forms/button';

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function LogoutButton({
  className,
  variant = 'ghost',
  size = 'default',
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    try {
      // Сначала вызываем наш API route для очистки куки
      const logoutResponse = await fetch(`${basePath}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (logoutResponse.ok) {
        // Перенаправляем на страницу входа
        window.location.href = `${basePath}/login`;
      } else {
        logger.error('Ошибка при выходе из системы');
      }
    } catch (error) {
      logger.error('Ошибка при выходе:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      <LogOut className='h-4 w-4 mr-2' />
      {isLoading ? 'Выход...' : 'Выйти'}
    </Button>
  );
}
