import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const cookieName = process.env.AUTH_COOKIE_NAME || '.AspNetCore.Identity.Application';
    const domain = process.env.NEXT_PUBLIC_DOMAIN || '.compass.local';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const response = NextResponse.json(
      { success: true, message: 'Успешно вышел из системы' },
      { status: 200 },
    );

    // Вызываем бэкенд для инвалидации сессии и получения правильного Set-Cookie
    if (apiUrl) {
      try {
        const backendResponse = await fetch(`${apiUrl}/Auth/logout`, {
          method: 'POST',
          headers: {
            'Cookie': request.headers.get('cookie') || '',
            'Content-Type': 'application/json',
          },
        });

        // Пробрасываем все Set-Cookie заголовки от бэкенда в ответ браузеру
        const setCookieHeader = backendResponse.headers.get('set-cookie');
        if (setCookieHeader) {
          response.headers.append('Set-Cookie', setCookieHeader);
        }
      } catch {
        // Продолжаем даже если бэкенд недоступен
      }
    }

    // Дополнительно очищаем куку на стороне Next.js как fallback
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: domain,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: '⚠️ Не удалось выйти из системы' },
      { status: 500 },
    );
  }
}
