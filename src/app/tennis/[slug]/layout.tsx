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
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  let manifestHref = `/tennis/${slug}/manifest.webmanifest`

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id && user.email) {
      const token = signInstallToken({ sub: user.id, eml: user.email, sport: 'tennis', slug })
      manifestHref = `/tennis/${slug}/manifest.webmanifest?install_token=${encodeURIComponent(token)}`
    }
  } catch { /* anonymous fall-through */ }

  return {
    title:        `Lumio Tennis — ${slug}`,
    manifest:     manifestHref,
    appleWebApp: {
      capable:        true,
      title:          'Lumio Tennis',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon:  '/tennis_logo.png',
      apple: '/tennis_logo.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#A855F7',
}

export default function TennisSlugLayout({ children }: { children: React.ReactNode }) {
  return children
}
