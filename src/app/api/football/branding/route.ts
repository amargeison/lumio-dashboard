import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isValidHex } from '@/lib/club-theme'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const SELECT_FIELDS = 'id, slug, name, primary_colour, secondary_colour, accent_colour, text_on_primary, text_on_secondary, kit_home_colour, kit_away_colour, font_preference, badge_shape'

const ALLOWED_FONTS = ['Inter','Roboto','Poppins','Montserrat','Lato']
const ALLOWED_SHAPES = ['shield','circle','crest','square','hexagon']

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    const { searchParams } = new URL(req.url)
    const clubId = searchParams.get('clubId')
    if (!clubId) return NextResponse.json({ error: 'clubId required' }, { status: 400 })

    const { data, error } = await supabase
      .from('football_clubs')
      .select(SELECT_FIELDS)
      .eq('id', clubId)
      .single()

    if (error || !data) {
      console.error('[branding GET]', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ branding: data })
  } catch (err) {
    console.error('[branding GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    const body = await req.json().catch(() => null)
    if (!body || !body.clubId) return NextResponse.json({ error: 'clubId required' }, { status: 400 })

    const updates: Record<string, any> = {}
    const hexFields: [string, string][] = [
      ['primaryColour', 'primary_colour'],
      ['secondaryColour', 'secondary_colour'],
      ['accentColour', 'accent_colour'],
      ['textOnPrimary', 'text_on_primary'],
      ['textOnSecondary', 'text_on_secondary'],
      ['kitHomeColour', 'kit_home_colour'],
      ['kitAwayColour', 'kit_away_colour'],
    ]
    for (const [bodyKey, dbKey] of hexFields) {
      const v = body[bodyKey]
      if (v === undefined) continue
      if (v === null) { updates[dbKey] = null; continue }
      if (!isValidHex(v)) {
        return NextResponse.json({ error: `Invalid hex for ${bodyKey}: ${v}` }, { status: 400 })
      }
      updates[dbKey] = v
    }
    if (body.fontPreference !== undefined) {
      if (!ALLOWED_FONTS.includes(body.fontPreference)) {
        return NextResponse.json({ error: 'Invalid font' }, { status: 400 })
      }
      updates.font_preference = body.fontPreference
    }
    if (body.badgeShape !== undefined) {
      if (!ALLOWED_SHAPES.includes(body.badgeShape)) {
        return NextResponse.json({ error: 'Invalid badge shape' }, { status: 400 })
      }
      updates.badge_shape = body.badgeShape
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('football_clubs')
      .update(updates)
      .eq('id', body.clubId)
      .select(SELECT_FIELDS)
      .single()

    if (error) {
      console.error('[branding PATCH]', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updatedClub: data })
  } catch (err) {
    console.error('[branding PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
