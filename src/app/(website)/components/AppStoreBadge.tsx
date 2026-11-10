import { APP_STORE_URL } from '@/lib/app/app-store'

// Apple's official black "Download on the App Store" badge, linking to Lumio
// Tennis Coach. Apple's rules: use the artwork exactly as supplied (no
// redrawing, recolouring or effects), at least 40px tall on screen, with clear
// space around it. The file comes from Apple Marketing Tools and lives in
// public/badges; replace it there, never edit it.
export const APP_STORE_BADGE_SRC = '/badges/app-store-badge-black.svg'

export default function AppStoreBadge({ height = 40 }: { height?: number }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download Lumio Tennis Coach on the App Store"
      title="Lumio Tennis Coach · free on the App Store"
      style={{ display: 'inline-block', lineHeight: 0, flexShrink: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={APP_STORE_BADGE_SRC}
        alt="Download on the App Store"
        height={height}
        loading="lazy"
        decoding="async"
        style={{ height, width: 'auto', display: 'block' }}
      />
    </a>
  )
}
