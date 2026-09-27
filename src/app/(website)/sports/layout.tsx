import type { Metadata } from 'next'
import { shareMeta, ogImageUrl } from '@/lib/share-meta'

// lumiosports.com lands here (the root redirects to /sports), so this is the
// preview most people see when the site itself is shared.
export const metadata: Metadata = shareMeta({
  title: 'Lumio Sports — the business side of sport, in one place',
  description: 'Software for coaches, clubs, academies and athletes: bookings, player development, camps, messaging and more. Home of Lumio Tennis Coach.',
  image: ogImageUrl({ page: 'sports' }),
  siteName: 'Lumio Sports',
  url: 'https://www.lumiosports.com/sports',
})

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return children
}
