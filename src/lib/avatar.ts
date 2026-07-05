// Client helpers for player profile photos: square-crop + downscale a chosen file
// to a small JPEG data URL, and POST it to a scoped upload route.

// Resolve any stored avatar value to a renderable <img src>. Player/staff photos
// live in the PRIVATE `avatars` bucket, so a bare storage path — or a legacy full
// public URL — is routed through the coach signing proxy (which auth-checks and
// mints a short-lived signed URL). Data-URL upload previews and already-signed
// URLs pass through unchanged. Degrades gracefully whether or not the bucket has
// been flipped to private yet.
export function avatarSrc(value?: string | null): string {
  if (!value) return ''
  if (value.startsWith('data:')) return value
  if (value.includes('/object/sign/')) return value                 // already signed
  const m = value.match(/\/avatars\/(.+?)(?:\?|$)/)                  // full public URL → path
  if (m) return `/api/coach/avatar-img?p=${encodeURIComponent(m[1])}`
  if (value.startsWith('http') || value.startsWith('/')) return value // some other/external URL
  return `/api/coach/avatar-img?p=${encodeURIComponent(value)}`      // bare storage path
}

export async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('no canvas')); return }
        const s = Math.min(img.width, img.height) // centre cover-crop to a square
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export async function uploadAvatar(endpoint: string, body: Record<string, unknown>): Promise<string | null> {
  try {
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    return r.ok ? (d.url as string) : null
  } catch { return null }
}
