import type { Metadata, Viewport } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInstallToken } from '@/lib/pwa-install-token'

// Server component wrapping the client [slug]/page.tsx so we can export
// generateMetadata. Sets the per-slug manifest link + iOS standalone tags
// at SSR time — overrides the global manifest in the root layout so
// "Add to Home Screen" installs open directly into this sport portal.
//
// PWA install-token handoff
// ─────────────────────────
// Per W3C webmanifest spec §4, browsers fetch the manifest with
// credentials mode 'omit' unless the link element has crossorigin set
// to 'use-credentials' — which Next's metadata API doesn't expose. So
// the manifest route can never see the user's session cookies.
//
// Instead: detect the session HERE (this page render DOES carry
// cookies) and append ?install_token=<JWT> to the manifest LINK URL.
// The manifest route then reads the token off its own URL and bakes it
// into start_url. Anonymous users get the bare manifest URL → bare
// start_url → normal email-gate flow.
//
// `x-lumio-pwa-debug` meta tag exposes the mint-path outcome to view
// source so we can diagnose token-mint failures from the page itself
// without needing PM2 log access.
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  // Anonymous renders use a stable `/m/anon/...` path so iOS keeps a single
  // cache entry for the email-gate persona. Authed renders below swap to a
  // per-render cache-buster so iOS refetches and picks up the install_token.
  let manifestHref = `/tennis/${slug}/m/anon/manifest.webmanifest`
  let debugReason = 'anon'

  try {
    const cookieStore = await cookies()
    const cookieNames = cookieStore.getAll().map(c => c.name).join(',')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      debugReason = `auth-error:${error.message}`
    } else if (!user) {
      debugReason = `no-user:cookies=[${cookieNames}]`
    } else if (!user.email) {
      debugReason = 'no-email'
    } else {
      try {
        const token = signInstallToken({ sub: user.id, eml: user.email, sport: 'tennis', slug })
        // Per-render path segment so iOS Safari sees a brand-new manifest URL
        // every time and bypasses its path-keyed manifest cache (which ignores
        // Cache-Control headers on the response).
        const cacheBuster = Date.now().toString(36)
        manifestHref = `/tennis/${slug}/m/${cacheBuster}/manifest.webmanifest?install_token=${encodeURIComponent(token)}`
        debugReason = 'minted'
      } catch (e) {
        debugReason = `mint-error:${e instanceof Error ? e.message : String(e)}`
      }
    }
  } catch (e) {
    debugReason = `cookies-error:${e instanceof Error ? e.message : String(e)}`
  }

  console.log('[layout-meta] ' + JSON.stringify({ sport: 'tennis', slug, hasUser: debugReason === 'minted', mintedToken: debugReason === 'minted', reason: debugReason }))

  return {
    title:        `Lumio Tennis — ${slug}`,
    manifest:     manifestHref,
    appleWebApp: {
      capable:        true,
      title:          'Lumio Tennis',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      // Tab favicon: small Lumio-branded PNG. The 1024×1024 sport logo is
      // unusable here — browsers can't rasterise 840 KB photo PNGs at 16×16
      // and fall back to a dark placeholder. Sport branding lives on the
      // apple-touch-icon below, which iOS uses at real size on the PWA
      // home-screen install.
      icon: [
        { url: '/lumio-favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/lumio-favicon-64.png', sizes: '64x64', type: 'image/png' },
      ],
      apple: '/tennis_logo.png',
    },
    other: {
      'x-lumio-pwa-debug': debugReason,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#A855F7',
}

export default function TennisSlugLayout({ children }: { children: React.ReactNode }) {
  return children
}
