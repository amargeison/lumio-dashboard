import type { Metadata, Viewport } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  return {
    title:        `Lumio Boxing — ${slug}`,
    manifest:     `/boxing/${slug}/manifest.webmanifest`,
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
