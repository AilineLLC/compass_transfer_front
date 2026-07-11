'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from '@shared/lib/conditional-toast';
import { AuthService } from '@shared/api/auth-service';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';

interface TerminalLoginFormProps extends React.ComponentProps<'form'> {
  className?: string;
}

export function TerminalLoginForm({ className, ...props }: TerminalLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await AuthService.loginTerminal({
        email,
        password,
        twoFactorCode: null,
        twoFactorRecoveryCode: null,
      });

      if (!result.error) {
        // Успешный вход - перенаправляем на главную терминала
        toast.success('Успешный вход в терминал');
        window.location.href = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/';
      } else if (result.error) {
        // Показываем toast для разных типов ошибок
        switch (result.error.type) {
          case 'auth':
            toast.error('Неверный email или пароль');
            break;
          case 'validation':
            toast.error(result.error.message || 'Ошибка валидации данных');
            break;
          case 'network':
            toast.error('Ошибка сети. Проверьте подключение к интернету');
            break;
          case 'server':
            toast.error('Ошибка сервера. Попробуйте позже');
            break;
          default:
            toast.error(result.error.message || 'Произошла ошибка');
        }
      }
    } catch {
      toast.error('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={cn('flex flex-col gap-6', className)} onSubmit={handleSubmit} {...props}>
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-bold'>Вход в терминал</h1>
        <p className='text-muted-foreground text-sm text-balance'>
          Введите email и пароль для входа в терминал
        </p>
      </div>

      <div className='grid gap-6'>
        <div className='grid gap-3'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='terminal@compass.local'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className='grid gap-3'>
          <Label htmlFor='password'>Пароль</Label>
          <Input
            id='password'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти в терминал'}
        </Button>
      </div>

      <div className='text-center text-sm text-muted-foreground'>
        Проблемы со входом?{' '}
        <Link href='/support' className='text-primary hover:underline'>
          Обратитесь в поддержку
        </Link>
      </div>
    </form>
  );
}
