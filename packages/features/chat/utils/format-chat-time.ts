function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Короткое время/дата для списка диалогов и заголовков сообщений */
export function formatChatTime(dateString?: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();

  if (isSameDay(date, now)) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, yesterday)) {
    return 'Вчера';
  }

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** Полная дата и время для тултипов/деталей сообщения */
export function formatChatDateTime(dateString?: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Компактная метка времени под сообщением: "18:44" сегодня, "11.07, 18:44" в другие дни */
export function formatMessageMeta(dateString?: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return '';

  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (isSameDay(date, new Date())) return time;

  const shortDate = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

  return `${shortDate}, ${time}`;
}
