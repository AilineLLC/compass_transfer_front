type LoaderProps = {
  src: string
  width: number
  quality?: number
}

/**
 * Кастомный image loader для корректной работы Next.js image optimizer при наличии basePath.
 *
 * Проблема: optimizer получает запрос `/admin/_next/image?url=%2Flogo%2Ffile.png`
 * и внутренне пытается загрузить источник по URL `https://host/logo/file.png` (без basePath) → 404.
 *
 * Решение: помещаем basePath внутрь параметра `url`, чтобы optimizer обращался
 * к `https://host/admin/logo/file.png` → файл существует → 200.
 */
export default function imageLoader({ src, width, quality }: LoaderProps): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  // Для локальных путей (начинаются с /) добавляем basePath в параметр url,
  // чтобы optimizer забирал изображение по правильному пути.
  // Для внешних URL (http/https) basePath не добавляем.
  const urlParam =
    src.startsWith('/') && basePath && !src.startsWith(basePath)
      ? basePath + src
      : src

  return `${basePath}/_next/image?url=${encodeURIComponent(urlParam)}&w=${width}&q=${quality ?? 75}`
}
