import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isJWTExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const paddedPayload = parts[1] + '='.repeat((4 - (parts[1].length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(paddedPayload, 'base64').toString('utf-8'));
    if (typeof decoded.exp !== 'number') return false;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCookie =
    request.cookies.get('auth-token') ||
    request.cookies.get('.AspNetCore.Identity.Application') ||
    request.cookies.get('__Host-auth-token');

  const publicPages = ['/login', '/forgot-password', '/reset-password', '/register'];
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));

  const tokenExpired = authCookie ? isJWTExpired(authCookie.value) : false;
  const isAuthenticated = !!authCookie && !tokenExpired;

  if (!isAuthenticated && !isPublicPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Очищаем протухшую куку, чтобы избежать бесконечного редиректа
    if (authCookie && tokenExpired) {
      const cookieName = process.env.AUTH_COOKIE_NAME || '.AspNetCore.Identity.Application';
      // Derive domain from env, fall back to parent domain of the actual request hostname
      // so cookie clearing always works without a hardcoded local fallback
      const hostname = request.nextUrl.hostname;
      const domain =
        process.env.NEXT_PUBLIC_DOMAIN ||
        (hostname.includes('.') ? `.${hostname.split('.').slice(-2).join('.')}` : hostname);
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain,
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }
    return response;
  }

  if (isAuthenticated && isPublicPage) {
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
