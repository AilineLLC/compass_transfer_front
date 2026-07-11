import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

/**
 * Декодирует JWT токен без проверки подписи
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }
    // Декодируем payload (вторая часть JWT)
    const payload = parts[1];
    // Добавляем padding если нужно
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(paddedPayload, 'base64').toString('utf-8');

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Получает сырое значение куки без парсинга
 */
export async function getRawCookie(cookieName: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(cookieName);

    return cookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Получает сырое значение куки из NextRequest (для middleware)
 */
export function getRawCookieFromRequest(request: NextRequest, cookieName: string): string | null {
  try {
    const cookie = request.cookies.get(cookieName);

    return cookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Парсит куку и возвращает данные
 */
export async function parseCookie(cookieName: string): Promise<Record<string, unknown> | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(cookieName);

    if (!cookie?.value) {
      return null;
    }

    return parseCookieValue(cookie.value, cookieName);
  } catch {
    return null;
  }
}

/**
 * Парсит куку из NextRequest (для middleware)
 */
export function parseCookieFromRequest(
  request: NextRequest,
  cookieName: string,
): Record<string, unknown> | null {
  try {
    const cookieValue = getRawCookieFromRequest(request, cookieName);

    if (!cookieValue) {
      return null;
    }

    return parseCookieValue(cookieValue, cookieName);
  } catch {
    return null;
  }
}

/**
 * Универсальная функция для парсинга значения куки
 */
function parseCookieValue(cookieValue: string, _cookieName: string): Record<string, unknown> | null {
  // Декодируем куку
  let cookieData: Record<string, unknown> | null = null;

  try {
    // Пробуем парсить как JSON
    cookieData = JSON.parse(cookieValue);
  } catch {
    try {
      // Пробуем декодировать как base64 и затем парсить
      const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');

      cookieData = JSON.parse(decoded);
    } catch {
      // Пробуем декодировать как JWT
      cookieData = decodeJWT(cookieValue);
      if (!cookieData) {
        return null;
      }
    }
  }

  return cookieData;
}

/**
 * Получает данные пользователя из JWT куки
 */
export function getUserFromJWTCookie(
  request: NextRequest,
): { id: string; role: string; fullName: string } | null {
  const authCookieName = process.env.AUTH_COOKIE_NAME || '.AspNetCore.Identity.Application';
  const rawToken = getRawCookieFromRequest(request, authCookieName);

  if (!rawToken) {
    return null;
  }

  // Проверяем истёк ли токен
  const decoded = decodeJWT(rawToken);
  if (!decoded) {
    return null;
  }
  if (typeof decoded.exp === 'number' && decoded.exp * 1000 < Date.now()) {
    return null;
  }

  const cookieData = parseCookieFromRequest(request, authCookieName);

  if (!cookieData) {
    return null;
  }

  const userId = String(
    cookieData['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
  );
  const role = String(
    cookieData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '',
  );
  const fullName = String(
    cookieData['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
  );

  if (!userId || !role) {
    return null;
  }

  return { id: userId, role, fullName };
}
