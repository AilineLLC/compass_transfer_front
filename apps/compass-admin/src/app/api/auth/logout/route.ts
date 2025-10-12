import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Успешно вышел из системы' },
      { status: 200 },
    );

    // Удаляем куки аутентификации
    const cookieName = process.env.AUTH_COOKIE_NAME || '.AspNetCore.Identity.Application';
    const domain = process.env.NEXT_PUBLIC_DOMAIN || '.compass.local';

    // Удаляем куку с правильными параметрами
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: domain,
      path: '/',
      maxAge: 0, // Устанавливаем maxAge в 0 для немедленного удаления
      expires: new Date(0), // Устанавливаем дату истечения в прошлое
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: '⚠️ Не удалось выйти из системы' },
      { status: 500 },
    );
  }
}
