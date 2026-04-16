'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { AuthService } from '@shared/api/auth-service';
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

    // 1. Вызываем бэкенд напрямую из браузера — он корректно очистит сессию и куку
    try {
      await AuthService.logout();
    } catch (error) {
      logger.warn('Ошибка при вызове бэкенд logout:', error);
    }

    // 2. Дополнительно очищаем куки на стороне Next.js через API route
    try {
      await fetch(`${basePath}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      logger.warn('Ошибка при вызове Next.js logout route:', error);
    }

    // 3. Перенаправляем на страницу входа в любом случае
    window.location.href = `${basePath}/login`;
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
