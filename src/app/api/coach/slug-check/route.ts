import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { cleanSlug, RESERVED_SLUGS, MAX_SLUG } from '@/app/api/sports-auth/_lib/account'

export const runtime = 'nodejs'

// Is this portal address free? Used by the sign-up wizard as the coach types.
//
// Two academies on one address is now impossible at the database (migration
// 186), but finding that out as an error on the last step of sign-up — after
// the coach has filled in everything else — is the wrong moment. This says so
// while they are still looking at the box, and offers the nearest free one.
//
// Answers only yes/no and a suggestion: never whose academy holds the name.

// The reserved words and the cleaning rule are sign-up's own (see
// sports-auth/_lib/account), so the two can never disagree about an address.

export async function GET(req: NextRequest) {
  // "Is there an academy at this address at all?" — asked by the portal page
  // for a visitor who is not signed in, so a mistyped address can say so
  // instead of offering a sign-in box for an academy that does not exist.
  // Yes or no only, and exact: the address is not treated as a pattern.
  const exists = req.nextUrl.searchParams.get('exists')
  if (exists !== null) {
    if (!rateLimit(`slug-exists-ip:${clientIp(req.headers)}`, 60, 10 * 60_000).ok) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
    }
    const want = exists.trim().toLowerCase()
    if (!/^[a-z0-9-]{1,200}$/.test(want)) return NextResponse.json({ exists: false })
    const { data, error } = await serviceClient().from('sports_profiles')
      // ilike for case only — the pattern above has already ruled out % and _.
      .select('id').eq('sport', 'coach').ilike('portal_slug', want).limit(1)
    if (error) return NextResponse.json({ error: 'Could not check that address' }, { status: 500 })
    return NextResponse.json({ exists: !!(data as { id: string }[] | null)?.length })
  }

  const uid = await sessionCoachId()
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const typed = (req.nextUrl.searchParams.get('slug') || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  // Judged at its full length. Cutting it to the limit first compared a
  // different address from the one in the box, so an over-long one got no
  // verdict at all and would have been saved in full.
  if (typed.length > MAX_SLUG) return NextResponse.json({ slug: typed, available: false, reason: 'long' })
  const slug = cleanSlug(typed)
  if (!slug) return NextResponse.json({ slug, available: false, reason: 'empty' })
  if (slug.length < 2) return NextResponse.json({ slug, available: false, reason: 'short' })
  if (RESERVED_SLUGS.has(slug)) return NextResponse.json({ slug, available: false, reason: 'reserved' })

  const db = serviceClient()
  const taken = async (s: string) => {
    if (RESERVED_SLUGS.has(s)) return true
    const { data } = await db.from('sports_profiles')
      .select('id').eq('sport', 'coach').ilike('portal_slug', s).neq('id', uid).limit(1)
    return !!(data as { id: string }[] | null)?.length
  }

  if (!(await taken(slug))) return NextResponse.json({ slug, available: true })

  // The nearest free one. Numbers rather than anything clever: a coach can
  // see at a glance what happened, and can type something better if they like.
  const stem = cleanSlug(slug.slice(0, MAX_SLUG - 5))
  for (let i = 2; i <= 30; i++) {
    const candidate = `${stem}-${i}`
    if (!(await taken(candidate))) return NextResponse.json({ slug, available: false, suggestion: candidate })
  }
  return NextResponse.json({ slug, available: false, reason: 'taken' })
}
