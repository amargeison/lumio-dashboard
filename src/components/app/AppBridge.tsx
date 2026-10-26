'use client'

// What makes the website behave like an app inside the iPhone app (Lumio
// Tennis Coach on the App Store). Mounted once, in the root layout. In a
// browser it does nothing at all.
//
//   • notifications: once someone is signed in, ask (once) and tell our server
//     which phone to send to; tapping one opens the page it is about
//   • links: our own pages stay in the app; other sites open in a Safari sheet
//     over the app instead of throwing you out of it
//   • downloads (exports, calendar files): handed to the iPhone share sheet,
//     because an app has no Downloads folder
//   • links from emails (lumiosports.com/…) open the right page in the app

import { useEffect } from 'react'
import { isNativeApp, nativePlugin, openInBrowserSheet, staysInside, safeAppPath } from '@/lib/app/native'

/* eslint-disable @typescript-eslint/no-explicit-any */
const TOKEN_KEY = 'lumio_app_push'   // { token, at } — the last token we told the server about

let started = false

function remembered(): { token: string; at: number } | null {
  try { const v = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null'); return v && typeof v.token === 'string' ? v : null } catch { return null }
}
function remember(token: string | null) {
  try { if (token) localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, at: Date.now() })); else localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ }
}

const onSignInPage = () => /^\/(sports-login|login)(\/|$)/.test(location.pathname)
const inDemo = () => /^\/(tennis\/)?coach\/demo(\/|$)|^\/app\/demo(\/|$)/.test(location.pathname)

async function appVersion(): Promise<string | null> {
  try { const info = await nativePlugin('App')?.getInfo?.(); return info ? `${info.version} (${info.build})` : null } catch { return null }
}

async function tellServer(token: string) {
  const last = remembered()
  // Once an hour is plenty: the token rarely changes, and a new sign-in
  // always starts from the sign-in page, which clears what we remembered.
  if (last?.token === token && Date.now() - last.at < 60 * 60_000) return
  const r = await fetch('/api/app/push', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, appVersion: await appVersion() }),
  }).catch(() => null)
  if (r?.ok) remember(token)
}

async function forgetPhone() {
  const last = remembered()
  if (!last) return
  await fetch('/api/app/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: last.token }) }).catch(() => null)
  remember(null)
}

function go(url: unknown) {
  const path = safeAppPath(url)
  if (path && path !== `${location.pathname}${location.search}`) window.location.href = path
}

async function setUpPush() {
  const Push = nativePlugin('PushNotifications')
  if (!Push) return
  await Push.addListener('registration', (t: { value: string }) => { void tellServer(t.value) })
  await Push.addListener('registrationError', (e: unknown) => { console.warn('[app] push registration failed', e) })
  await Push.addListener('pushNotificationActionPerformed', (a: any) => { go(a?.notification?.data?.url) })

  // Signed out: this phone must stop getting the last person's notifications.
  if (onSignInPage()) { await forgetPhone(); return }
  if (inDemo()) return
  const me = await fetch('/api/app/push', { cache: 'no-store' }).then(r => r.json()).catch(() => null)
  if (!me?.signedIn) return

  let perm = await Push.checkPermissions().catch(() => null)
  if (perm && (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale')) {
    perm = await Push.requestPermissions().catch(() => null)
  }
  if (perm?.receive === 'granted') await Push.register().catch(() => {})
}

async function shareFile(href: string, name: string) {
  try {
    const blob = await (await fetch(href)).blob()
    const file = new File([blob], name || 'download', { type: blob.type || 'application/octet-stream' })
    const nav = navigator as Navigator & { canShare?: (d: object) => boolean }
    if (nav.share && nav.canShare?.({ files: [file] })) { await nav.share({ files: [file], title: name }); return }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return   // they closed the share sheet
  }
  if (/^https?:/i.test(href)) void openInBrowserSheet(new URL(href, location.href).href)
}

function wantsDownload(a: HTMLAnchorElement, url: URL) {
  return a.hasAttribute('download') || url.protocol === 'blob:' || url.protocol === 'data:'
}

/** Decides what a tap on a link does. True when it was dealt with here. */
function handleLink(a: HTMLAnchorElement): boolean {
  const raw = a.getAttribute('href')
  if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return false
  let url: URL
  try { url = new URL(a.href, location.href) } catch { return false }
  if (wantsDownload(a, url)) { void shareFile(url.href, a.getAttribute('download') || url.pathname.split('/').pop() || 'download'); return true }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false   // mailto:, tel:, sms: — the phone handles these
  if (staysInside(url.host)) {
    if (a.target && a.target !== '_self') { window.location.href = url.href; return true }   // no tabs in an app
    return false
  }
  void openInBrowserSheet(url.href).then(ok => { if (!ok) window.location.href = url.href })
  return true
}

function wireLinks() {
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0) return
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (a && handleLink(a)) e.preventDefault()
  }, true)

  // Exports build a link in code and click it without adding it to the page,
  // so the click never reaches the listener above.
  const click = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (!this.isConnected && this.href && handleLink(this)) return
    return click.call(this)
  }

  const open = window.open.bind(window)
  window.open = ((u?: string | URL, target?: string, features?: string) => {
    if (!u || String(u) === 'about:blank') return open(u as string, target, features)
    let url: URL
    try { url = new URL(String(u), location.href) } catch { return open(u as string, target, features) }
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      if (staysInside(url.host)) { window.location.href = url.href; return null }
      void openInBrowserSheet(url.href)
      return null
    }
    return open(u as string, target, features)
  }) as typeof window.open
}

async function wireDeepLinks() {
  const App = nativePlugin('App')
  if (!App) return
  // A lumiosports.com link tapped in Mail or Messages opens the app (once the
  // site and the app are linked): show that page.
  await App.addListener('appUrlOpen', (e: { url?: string }) => { go(e?.url) })
}

async function start() {
  document.documentElement.classList.add('lumio-app')
  try { await nativePlugin('StatusBar')?.setStyle?.({ style: 'DARK' }) } catch { /* older app */ }
  wireLinks()
  await wireDeepLinks().catch(() => {})
  await setUpPush().catch(e => console.warn('[app] push', e))
}

export function AppBridge() {
  useEffect(() => {
    if (started || !isNativeApp()) return
    started = true
    void start()
  }, [])
  return null
}
