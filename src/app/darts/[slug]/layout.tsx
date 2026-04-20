import type { Metadata, Viewport } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  return {
    title:        `Lumio Darts — ${slug}`,
    manifest:     `/darts/${slug}/manifest.webmanifest`,
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
