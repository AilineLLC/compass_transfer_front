type LoaderProps = {
  src: string
  width: number
  quality?: number
}

/**
 * Кастомный image loader для корректной работы Next.js image optimizer при наличии basePath.
 *
 * Проблема: optimizer получает запрос `/driver/_next/image?url=%2Fcar%2Ffile.png`
 * и внутренне пытается загрузить источник по URL `https://host/car/file.png` (без basePath) → 404.
 *
 * Решение: помещаем basePath внутрь параметра `url`, чтобы optimizer обращался
 * к `https://host/driver/car/file.png` → файл существует → 200.
 */
export default function imageLoader({ src, width, quality }: LoaderProps): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  const urlParam =
    src.startsWith('/') && basePath && !src.startsWith(basePath)
      ? basePath + src
      : src

  return `${basePath}/_next/image?url=${encodeURIComponent(urlParam)}&w=${width}&q=${quality ?? 75}`
}
