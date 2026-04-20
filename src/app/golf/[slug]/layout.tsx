import type { Metadata, Viewport } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  return {
    title:        `Lumio Golf — ${slug}`,
    manifest:     `/golf/${slug}/manifest.webmanifest`,
    appleWebApp: {
      capable:        true,
      title:          'Lumio Golf',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon:  '/golf_logo.png',
      apple: '/golf_logo.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#A855F7',
}

export default function GolfSlugLayout({ children }: { children: React.ReactNode }) {
  return children
}
