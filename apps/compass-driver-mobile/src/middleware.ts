import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromJWTCookie } from '@shared/lib/parse-cookie';

// Публичные маршруты, которые не требуют аутентификации
const DRIVER_PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

// Роли, которые имеют доступ к приложению водителя
const DRIVER_ALLOWED_ROLES = ['Driver'];

/**
 * Проверяет, является ли маршрут публичным
 */
function isPublicRoute(pathname: string, publicRoutes: string[]): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

/**
 * Middleware для защиты маршрутов driver-mobile приложения
 * Проверяет аутентификацию и перенаправляет неавторизованных пользователей на /login
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем, является ли маршрут публичным
  if (isPublicRoute(pathname, DRIVER_PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Для защищенных маршрутов проверяем аутентификацию
  const user = await getUserFromJWTCookie(request);

  // Если пользователь не авторизован, перенаправляем на /login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Проверяем доступ к приложению водителя
  if (pathname.startsWith('/(driver)') || pathname.startsWith('/')) {
    if (!DRIVER_ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Конфигурация middleware
 * Применяем middleware ко всем маршрутам кроме API routes и статических файлов
 */
export const config = {
  matcher: [
    /*
     * Применяем middleware ко всем маршрутам кроме:
     * - api routes
     * - _next/static (статические файлы)
     * - _next/image (оптимизация изображений)
     * - favicon.ico
     * - статические ресурсы из папки public
     */
    '/((?!api|_next/static|_next/image|favicon.ico|background|car|order|sounds|fonts|auto|.well-known).*)',
  ],
};
