import type { Metadata } from 'next'
import { shareMeta, ogImageUrl } from '@/lib/share-meta'

// The player and parent app. Its page is a client component, so the link
// preview copy lives here rather than falling back to the root layout's.
export const metadata: Metadata = shareMeta({
  title: 'Your coaching — Lumio Tennis Coach',
  description: 'Sessions, lesson summaries, progress and messages from your coach.',
  image: ogImageUrl({ page: 'player' }),
  siteName: 'Lumio Tennis Coach',
})

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children
}
