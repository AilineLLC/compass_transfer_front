'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { AuthService } from '@shared/api/auth-service';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/forms/button';
import { Input } from '@shared/ui/forms/input';
import { Label } from '@shared/ui/forms/label';

interface LoginFormProps extends React.ComponentProps<'form'> {
  className?: string;
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await AuthService.login({
        email,
        password,
        twoFactorCode: null,
        twoFactorRecoveryCode: null,
      });

      if (!result.error) {
        // Успешный вход - перенаправляем на главную
        toast.success('Успешный вход в систему');
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
        <h1 className='text-2xl font-bold'>Вход в систему</h1>
        <p className='text-muted-foreground text-sm text-balance'>
          Введите email и пароль для входа в админ-панель
        </p>
      </div>

      <div className='grid gap-6'>
        <div className='grid gap-3'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='admin@compass.local'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className='grid gap-3'>
          {/* <div className='flex items-center'>
            <Label htmlFor='password'>Пароль</Label>
            <a
              href='/forgot-password'
              className='ml-auto text-sm underline-offset-4 hover:underline'
            >
              Забыли пароль?
            </a>
          </div> */}
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className='pr-10'
            />
            <button
              type='button'
              onClick={() => setShowPassword(v => !v)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </button>
          </div>
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </Button>
      </div>

      <div className='text-center text-sm text-muted-foreground'>
        Нет аккаунта?{' '}
        <Link href='/register' className='text-primary hover:underline'>
          Зарегистрироваться как партнер
        </Link>
      </div>

      {/* <div className='text-center text-sm'>
        Нужна помощь?{' '}
        <a href='/support' className='underline underline-offset-4'>
          Обратитесь в поддержку
        </a>
      </div> */}
    </form>
  );
}
