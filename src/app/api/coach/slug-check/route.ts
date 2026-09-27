import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'

export const runtime = 'nodejs'

// Is this portal address free? Used by the sign-up wizard as the coach types.
//
// Two academies on one address is now impossible at the database (migration
// 186), but finding that out as an error on the last step of sign-up — after
// the coach has filled in everything else — is the wrong moment. This says so
// while they are still looking at the box, and offers the nearest free one.
//
// Answers only yes/no and a suggestion: never whose academy holds the name.

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Words that would collide with pages rather than with other academies.
const RESERVED = new Set(['demo', 'admin', 'new', 'settings', 'login', 'signup', 'api', 'portal', 'lumio', 'test'])

export async function GET(req: NextRequest) {
  const uid = await sessionCoachId()
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const slug = slugify(req.nextUrl.searchParams.get('slug') || '').slice(0, 60)
  if (!slug) return NextResponse.json({ slug, available: false, reason: 'empty' })

  const db = serviceClient()
  const taken = async (s: string) => {
    if (RESERVED.has(s)) return true
    const { data } = await db.from('sports_profiles')
      .select('id').eq('sport', 'coach').ilike('portal_slug', s).neq('id', uid).limit(1)
    return !!(data as { id: string }[] | null)?.length
  }

  if (!(await taken(slug))) return NextResponse.json({ slug, available: true })

  // The nearest free one. Numbers rather than anything clever: a coach can
  // see at a glance what happened, and can type something better if they like.
  for (let i = 2; i <= 30; i++) {
    const candidate = `${slug}-${i}`
    if (!(await taken(candidate))) return NextResponse.json({ slug, available: false, suggestion: candidate })
  }
  return NextResponse.json({ slug, available: false, reason: 'taken' })
}
