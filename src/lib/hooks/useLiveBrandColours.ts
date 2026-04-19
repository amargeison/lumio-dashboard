'use client'
import { useEffect } from 'react'

// Mirrors lumio_<sport>_brand_primary / _secondary from localStorage onto
// CSS custom properties so any chrome using var(--brand-primary) etc.
// updates live when the Settings picker fires 'lumio-profile-updated'.
// Defaults apply on first load / when the user hasn't picked.
export function useLiveBrandColours(
  sport: string,
  defaults: { primary: string; secondary: string },
) {
  const { primary, secondary } = defaults
  useEffect(() => {
    if (typeof window === 'undefined') return
    const apply = () => {
      const p = localStorage.getItem(`lumio_${sport}_brand_primary`) || primary
      const s = localStorage.getItem(`lumio_${sport}_brand_secondary`) || secondary
      const root = document.documentElement
      root.style.setProperty('--brand-primary', p)
      root.style.setProperty('--brand-secondary', s)
      // Common alpha variants reused by branded buttons/pills.
      // Hex-alpha suffix — 0x26 ≈ 15%, 0x4d ≈ 30%.
      root.style.setProperty('--brand-primary-15', `${p}26`)
      root.style.setProperty('--brand-primary-30', `${p}4d`)
    }
    apply()
    const onUpdate = () => apply()
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(`lumio_${sport}_brand_`)) apply()
    }
    window.addEventListener('lumio-profile-updated', onUpdate)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('lumio-profile-updated', onUpdate)
      window.removeEventListener('storage', onStorage)
    }
  }, [sport, primary, secondary])
}
