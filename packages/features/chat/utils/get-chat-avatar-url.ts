import type { ChatCounterpartyDTO } from '@entities/chat/interface';

export function getChatAvatarUrl(counterparty?: ChatCounterpartyDTO | null): string | null {
  const path = counterparty?.avatar?.path;

  if (!path) return null;

  // path уже абсолютный URL — используем как есть
  if (/^https?:\/\//i.test(path)) return path;

  const baseUrl = process.env.NEXT_PUBLIC_UPLOADS_URL;

  // Без базового URL получим невалидный "undefined/Uploads/..." — next/image упадёт с Invalid URL
  if (!baseUrl) return null;

  return `${baseUrl}/Uploads/${path}`;
}
