import type { Metadata, Viewport } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInstallToken } from '@/lib/pwa-install-token'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  let manifestHref = `/boxing/${slug}/manifest.webmanifest`

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id && user.email) {
      const token = signInstallToken({ sub: user.id, eml: user.email, sport: 'boxing', slug })
      manifestHref = `/boxing/${slug}/manifest.webmanifest?install_token=${encodeURIComponent(token)}`
    }
  } catch { /* anonymous fall-through */ }

  return {
    title:        `Lumio Boxing — ${slug}`,
    manifest:     manifestHref,
    appleWebApp: {
      capable:        true,
      title:          'Lumio Boxing',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon:  '/boxing_logo.png',
      apple: '/boxing_logo.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#A855F7',
}

export default function BoxingSlugLayout({ children }: { children: React.ReactNode }) {
  return children
}
