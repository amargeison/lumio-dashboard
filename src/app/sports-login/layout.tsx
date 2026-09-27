import type { Metadata } from 'next'

// The sign-in page is a client component, so its link-preview copy lives here.
// Without it a pasted sign-in link inherited the root layout's description,
// which belongs to the business product.
const title = 'Sign in — Lumio Sports'
const description = 'Sign in to your Lumio portal with your email and a one-time code. No password needed.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: 'Lumio Sports', type: 'website', images: [{ url: 'https://www.lumiosports.com/tennis_coach_logo.png' }] },
  twitter: { card: 'summary', title, description },
}

export default function SportsLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
