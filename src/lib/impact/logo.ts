// An uploaded logo: PNG, JPEG or WebP, told apart by their first bytes. No SVG (it can
// carry script). Same limits as the impact-org-assets bucket (migration 240).

export const LOGO_MAX_BYTES = 2 * 1024 * 1024

export function logoKind(b: Uint8Array): { type: string; ext: string } | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return { type: 'image/png', ext: 'png' }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' }
  if (b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WEBP') return { type: 'image/webp', ext: 'webp' }
  return null
}
