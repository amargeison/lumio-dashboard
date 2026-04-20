import type { Metadata, Viewport } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInstallToken } from '@/lib/pwa-install-token'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  let manifestHref = `/darts/${slug}/manifest.webmanifest`

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id && user.email) {
      const token = signInstallToken({ sub: user.id, eml: user.email, sport: 'darts', slug })
      manifestHref = `/darts/${slug}/manifest.webmanifest?install_token=${encodeURIComponent(token)}`
    }
  } catch { /* anonymous fall-through */ }

  return {
    title:        `Lumio Darts — ${slug}`,
    manifest:     manifestHref,
    appleWebApp: {
      capable:        true,
      title:          'Lumio Darts',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon:  '/darts_logo.png',
      apple: '/darts_logo.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#A855F7',
}

export default function DartsSlugLayout({ children }: { children: React.ReactNode }) {
  return children
}
