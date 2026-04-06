import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

function mergeArrays(a: unknown, b: unknown): string[] {
  const arrA = Array.isArray(a) ? a : []
  const arrB = Array.isArray(b) ? b : []
  return [...new Set([...arrA, ...arrB].map((v: unknown) => String(v)))]
}

function pickHigher(a: unknown, b: unknown): number | null {
  const numA = typeof a === 'number' ? a : null
  const numB = typeof b === 'number' ? b : null
  if (numA === null && numB === null) return null
  if (numA === null) return numB
  if (numB === null) return numA
  return Math.max(numA, numB)
}

function pickMostRecent(a: unknown, b: unknown): string | null {
  const dateA = a ? new Date(String(a)) : null
  const dateB = b ? new Date(String(b)) : null
  if (!dateA || isNaN(dateA.getTime())) return dateB && !isNaN(dateB.getTime()) ? String(b) : null
  if (!dateB || isNaN(dateB.getTime())) return String(a)
  return dateA >= dateB ? String(a) : String(b)
}

const ARRAY_FIELDS = new Set(['tags', 'buying_signals'])
const NUMERIC_MAX_FIELDS = new Set(['aria_score', 'lead_score', 'score'])
const DATE_RECENT_FIELDS = new Set(['last_contacted_at', 'last_activity_at', 'updated_at'])
const SKIP_FIELDS = new Set(['id', 'created_at', 'slug', 'business_id', 'is_demo', 'duplicate_score', 'duplicate_of', 'dedupe_reviewed_at'])

export async function POST(req: NextRequest) {
  try {
    const { type, winnerId, loserId, slug, mergeNotes } = await req.json() as {
      type: 'contact' | 'company'
      winnerId: string
      loserId: string
      slug: string
      mergeNotes: string
    }

    if (!type || !winnerId || !loserId || !slug) {
      return NextResponse.json({ error: 'type, winnerId, loserId, and slug are required' }, { status: 400 })
    }

    if (winnerId === loserId) {
      return NextResponse.json({ error: 'Winner and loser cannot be the same record' }, { status: 400 })
    }

    const supabase = getSupabase()
    const table = type === 'contact' ? 'crm_contacts' : 'crm_companies'

    // Read both records
    const [winnerRes, loserRes] = await Promise.all([
      supabase.from(table).select('*').eq('id', winnerId).eq('slug', slug).single(),
      supabase.from(table).select('*').eq('id', loserId).eq('slug', slug).single(),
    ])

    if (winnerRes.error || !winnerRes.data) {
      return NextResponse.json({ error: `Winner not found: ${winnerRes.error?.message || 'no data'}` }, { status: 404 })
    }
    if (loserRes.error || !loserRes.data) {
      return NextResponse.json({ error: `Loser not found: ${loserRes.error?.message || 'no data'}` }, { status: 404 })
    }

    const winner = winnerRes.data as Record<string, unknown>
    const loser = loserRes.data as Record<string, unknown>

    // Snapshot before merge
    const winnerSnapshot = { ...winner }
    const loserSnapshot = { ...loser }

    // Merge: winner keeps its fields, fills nulls/empty from loser
    const mergedFields: string[] = []
    const updates: Record<string, unknown> = {}

    for (const key of Object.keys(loser)) {
      if (SKIP_FIELDS.has(key)) continue

      if (ARRAY_FIELDS.has(key)) {
        const merged = mergeArrays(winner[key], loser[key])
        const original = Array.isArray(winner[key]) ? winner[key] : []
        if (merged.length > (original as unknown[]).length) {
          updates[key] = merged
          mergedFields.push(key)
        }
      } else if (NUMERIC_MAX_FIELDS.has(key)) {
        const higher = pickHigher(winner[key], loser[key])
        if (higher !== null && higher !== winner[key]) {
          updates[key] = higher
          mergedFields.push(key)
        }
      } else if (DATE_RECENT_FIELDS.has(key)) {
        const recent = pickMostRecent(winner[key], loser[key])
        if (recent && recent !== String(winner[key])) {
          updates[key] = recent
          mergedFields.push(key)
        }
      } else {
        // Fill null/empty winner fields from loser
        const winVal = winner[key]
        const loseVal = loser[key]
        const winEmpty = winVal === null || winVal === undefined || winVal === ''
        const loseHasValue = loseVal !== null && loseVal !== undefined && loseVal !== ''
        if (winEmpty && loseHasValue) {
          updates[key] = loseVal
          mergedFields.push(key)
        }
      }
    }

    // Update winner with merged data
    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase.from(table).update(updates).eq('id', winnerId)
      if (updateErr) {
        console.error('[dedupe/merge] Winner update failed:', updateErr.message)
        return NextResponse.json({ error: `Failed to update winner: ${updateErr.message}` }, { status: 500 })
      }
    }

    // Reassign deals from loser to winner (contacts only)
    if (type === 'contact') {
      const { error: dealErr } = await supabase
        .from('crm_deals')
        .update({ contact_id: winnerId })
        .eq('contact_id', loserId)
      if (dealErr) {
        console.error('[dedupe/merge] Deal reassignment failed:', dealErr.message)
        // Continue — don't abort the merge for this
      }
    }

    // Write audit log
    const { data: auditData, error: auditErr } = await supabase.from('crm_merge_log').insert({
      slug,
      type,
      winner_id: winnerId,
      loser_id: loserId,
      winner_snapshot: winnerSnapshot,
      loser_snapshot: loserSnapshot,
      merged_fields: mergedFields,
      merge_notes: mergeNotes || null,
      merged_by: 'user',
    }).select('id').single()

    if (auditErr) {
      console.error('[dedupe/merge] Audit log failed:', auditErr.message)
    }

    // Delete loser
    const { error: deleteErr } = await supabase.from(table).delete().eq('id', loserId)
    if (deleteErr) {
      console.error('[dedupe/merge] Loser delete failed:', deleteErr.message)
      return NextResponse.json({ error: `Failed to delete loser: ${deleteErr.message}` }, { status: 500 })
    }

    // Fetch updated winner
    const { data: updatedWinner } = await supabase.from(table).select('*').eq('id', winnerId).single()

    return NextResponse.json({
      success: true,
      winner: updatedWinner,
      mergedFields,
      auditId: auditData?.id || null,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[dedupe/merge] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
