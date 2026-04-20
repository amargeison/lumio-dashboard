import type { Metadata, Viewport } from 'next'

// Server component wrapping the client [slug]/page.tsx so we can export
// generateMetadata. Sets the per-slug manifest link + iOS standalone tags
// at SSR time — overrides the global manifest in the root layout so
// "Add to Home Screen" installs open directly into this sport portal.
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  return {
    title:        `Lumio Tennis — ${slug}`,
    manifest:     `/tennis/${slug}/manifest.webmanifest`,
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
