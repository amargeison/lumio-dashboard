import type { Metadata } from 'next'

// Link-preview metadata for the Lumio Sports pages, in one place.
//
// Every page that can be pasted into Trello, WhatsApp, Slack or LinkedIn sends
// the same three things: a title that says what the link is, a description, and
// a 1200×630 card from /api/og with the logos kept small and the words on it
// (most apps hide the description once there is an image).

const SITE = 'https://www.lumiosports.com'

export function ogImageUrl(q: { slug?: string; v?: 'portal' | 'login'; page?: 'tennis-coach' | 'sports' | 'signin' | 'player' }): string {
  const p = new URLSearchParams()
  if (q.slug) p.set('slug', q.slug)
  if (q.v) p.set('v', q.v)
  if (q.page) p.set('page', q.page)
  return `${SITE}/api/og?${p}`
}

export function shareMeta({ title, description, image, siteName = 'Lumio Tennis Coach', url }: {
  title: string
  description: string
  image: string
  siteName?: string
  url?: string
}): Pick<Metadata, 'title' | 'description' | 'openGraph' | 'twitter'> {
  return {
    title,
    description,
    openGraph: {
      title, description, siteName, type: 'website',
      ...(url ? { url } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}
