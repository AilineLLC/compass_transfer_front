import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieName = process.env.AUTH_COOKIE_NAME || '.AspNetCore.Identity.Application';
    const domain = process.env.NEXT_PUBLIC_DOMAIN || '.compass.local';

    const response = NextResponse.json(
      { success: true, message: 'Успешно вышел из системы' },
      { status: 200 },
    );

    // Очищаем куку на стороне Next.js как дополнительная страховка
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
