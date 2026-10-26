// The iPhone app (Lumio Tennis Coach on the App Store) is a native shell around
// this website. Inside it, the native side puts `window.Capacitor` on every
// page from www.lumiosports.com, with the plugins the shell was built with.
//
// Nothing here imports a native package: the website stays exactly the same
// for everyone in a browser, and these helpers return false / do nothing there.

/* eslint-disable @typescript-eslint/no-explicit-any */
type CapacitorGlobal = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins?: Record<string, any>
}

function cap(): CapacitorGlobal | null {
  if (typeof window === 'undefined') return null
  return ((window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor) || null
}

/** True inside the App Store app, false in any browser (including a home-screen web app). */
export function isNativeApp(): boolean {
  try { return !!cap()?.isNativePlatform?.() } catch { return false }
}

/** One of the shell's plugins, or null in a browser or an older app version without it. */
export function nativePlugin<T = any>(name: string): T | null {
  if (!isNativeApp()) return null
  return (cap()?.Plugins?.[name] as T) || null
}

/** The hosts the app shows itself. Anything else opens in an in-app browser sheet. */
export const APP_HOSTS = ['www.lumiosports.com', 'lumiosports.com']
/** Payment pages that must stay inside the app so the return trip lands back in it. */
const KEEP_INSIDE = [/(^|\.)stripe\.com$/i, /(^|\.)stripe\.network$/i]

export function isOwnHost(host: string): boolean {
  return APP_HOSTS.includes(host.toLowerCase()) || (typeof location !== 'undefined' && host === location.host)
}

export function staysInside(host: string): boolean {
  return isOwnHost(host) || KEEP_INSIDE.some(r => r.test(host))
}

/** Opens a web address in the in-app browser sheet (Safari view). False if the app cannot. */
export async function openInBrowserSheet(url: string): Promise<boolean> {
  const Browser = nativePlugin('Browser')
  if (!Browser) return false
  try { await Browser.open({ url, presentationStyle: 'popover' }); return true } catch { return false }
}

/** A path on this site, from a push notification or a link — never another site. */
export function safeAppPath(v: unknown): string | null {
  if (typeof v !== 'string') return null
  try {
    const u = new URL(v, 'https://www.lumiosports.com')
    if (!isOwnHost(u.host) && u.host !== 'www.lumiosports.com') return null
    const path = `${u.pathname}${u.search}${u.hash}`
    return /^\/(?![\/\\])/.test(path) ? path : null
  } catch { return null }
}
