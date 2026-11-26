import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadJoinPage } from '@/lib/impact/join-page'
import JoinForm from './JoinForm'

// /impact/<slug>/join — the public weekend sign-up. Public even when the portal is
// private: it shows only the org's name, logo, venues and privacy policy link
// (src/lib/impact/join-page.ts). ?venue=<id> pre-selects a venue (the venue poster's
// QR); the sign-up is then recorded as channel "qr".
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await loadJoinPage((await params).slug)
  return { title: page ? `Join ${page.org}’s weekend sessions` : 'Sign up', robots: { index: false } }
}

export default async function JoinPage({ params, searchParams }: Props) {
  const { slug } = await params
  const page = await loadJoinPage(slug)
  if (!page) notFound()
  const q = await searchParams
  const venue = typeof q.venue === 'string' && page.venues.some(v => v.id === q.venue) ? q.venue : null
  return <JoinForm page={page} venue={venue} viaQr={venue !== null && q.src === 'qr'} />
}
