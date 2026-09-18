export function getImageUrl(imagePath: string | undefined): string {
  if (!imagePath) return ''
  if (/^https?:\/\//i.test(imagePath)) return imagePath

  const mediaBaseUrl = import.meta.env.VITE_MEDIA_URL ?? (
    import.meta.env.DEV ? 'http://127.0.0.1:8000' : window.location.origin
  )

  return `${mediaBaseUrl.replace(/\/$/, '')}/${imagePath.replace(/^\//, '')}`
}
