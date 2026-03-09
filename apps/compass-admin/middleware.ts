import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем различные возможные куки аутентификации
  const authToken = request.cookies.get('auth-token') ||
    request.cookies.get('.AspNetCore.Identity.Application') ||
    request.cookies.get('__Host-auth-token');

  // Публичные страницы, которые не требуют аутентификации
  const publicPages = ['/login', '/forgot-password', '/reset-password', '/register'];

  // Проверяем, является ли текущая страница публичной
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));

  // Если пользователь не авторизован и пытается получить доступ к защищенной странице
  if (!authToken && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Если пользователь авторизован и пытается получить доступ к странице входа
  if (authToken && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - статические ресурсы из папки public
     */
    '/((?!api|_next/static|_next/image|favicon.ico|background|logo|regions|taxi-tariffs|video|fonts|auto|.well-known).*)',
  ],
};
