import type { Metadata } from 'next'
import { shareMeta, ogImageUrl } from '@/lib/share-meta'

// The sign-in page is a client component, so its link-preview copy lives here.
// Without it a pasted sign-in link inherited the root layout's description,
// which belongs to the business product.
export const metadata: Metadata = shareMeta({
  title: 'Sign in — Lumio Sports',
  description: 'Sign in to your Lumio portal with your email and a one-time code. No password needed.',
  image: ogImageUrl({ page: 'signin' }),
  siteName: 'Lumio Sports',
})

export default function SportsLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
