import type { Metadata, Viewport } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInstallToken } from '@/lib/pwa-install-token'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  // See tennis layout — per-render manifest path segment defeats iOS's
  // path-keyed manifest cache.
  let manifestHref = `/boxing/${slug}/m/anon/manifest.webmanifest`
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
        const token = signInstallToken({ sub: user.id, eml: user.email, sport: 'boxing', slug })
        const cacheBuster = Date.now().toString(36)
        manifestHref = `/boxing/${slug}/m/${cacheBuster}/manifest.webmanifest?install_token=${encodeURIComponent(token)}`
        debugReason = 'minted'
      } catch (e) {
        debugReason = `mint-error:${e instanceof Error ? e.message : String(e)}`
      }
    }
  } catch (e) {
    debugReason = `cookies-error:${e instanceof Error ? e.message : String(e)}`
  }

  console.log('[layout-meta] ' + JSON.stringify({ sport: 'boxing', slug, hasUser: debugReason === 'minted', mintedToken: debugReason === 'minted', reason: debugReason }))

  return {
    title:        `Lumio Boxing — ${slug}`,
    manifest:     manifestHref,
    appleWebApp: {
      capable:        true,
      title:          'Lumio Boxing',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      // Tab favicon: small Lumio-branded PNG. See tennis/[slug]/layout.tsx
      // for rationale — 1024×1024 sport logos render as a dark placeholder.
      // Sport branding stays on the apple-touch-icon for iOS PWA installs.
      icon: [
        { url: '/lumio-favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/lumio-favicon-64.png', sizes: '64x64', type: 'image/png' },
      ],
      apple: '/boxing_logo.png',
    },
    other: {
      'x-lumio-pwa-debug': debugReason,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#DC2626', // boxing brand red
}

export default function BoxingSlugLayout({ children }: { children: React.ReactNode }) {
  return children
}
