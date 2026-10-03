import { NextRequest, NextResponse } from 'next/server'
import { adminFor, db } from '@/lib/outreach/core'
import { addProspects, companiesHouseReady, findCompanies, freeLookBatch, toSeg, type Prospect } from '@/lib/outreach/prospect'
import { paidDiscover, paidLookupBatch, paidSearchReady, spendThisMonth } from '@/lib/outreach/paid-search'

export const runtime = 'nodejs'
export const maxDuration = 120

// Admin Outreach → Find contacts.
//
// Two kinds of action live here and they are kept visibly apart:
//
//   FREE   findCompanies, freeLook, add, accept, dismiss, clear, cap
//   PAID   paidLookup, paidDiscover
//
// A paid action runs only when the request says `confirm: 'paid'` — which the
// page sends from one place, the button under the cost estimate. There is no
// timer, cron job or follow-on step anywhere that calls a paid action; the
// free actions never trigger one.

const STATES = ['new', 'no_email', 'unsure', 'found', 'nothing', 'added', 'dismissed'] as const

async function overview() {
  const sb = db()
  const [{ data: list }, counts, money] = await Promise.all([
    sb.from('outreach_prospects').select('*').neq('state', 'added').neq('state', 'dismissed').order('created_at', { ascending: false }).limit(400),
    Promise.all(STATES.map(async s => [s, (await sb.from('outreach_prospects').select('id', { count: 'exact', head: true }).eq('state', s)).count ?? 0] as const)),
    spendThisMonth(),
  ])
  const { count: searchable } = await sb.from('outreach_prospects').select('id', { count: 'exact', head: true }).eq('state', 'no_email').eq('searched_paid', false)
  return {
    prospects: (list || []) as Prospect[], counts: Object.fromEntries(counts), searchable: searchable ?? 0,
    spend: { ...money, perLookup: Math.round(money.perLookup * 1000) / 1000, perDiscover: Math.round(money.perDiscover * 100) / 100 },
    ready: { companiesHouse: companiesHouseReady(), paid: paidSearchReady() },
  }
}

export async function GET(req: NextRequest) {
  if (!await adminFor(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json(await overview()) }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not load.' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  if (!await adminFor(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = await req.json().catch(() => ({})) as Record<string, any>
  const sb = db()
  const now = new Date().toISOString()
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(String).filter((s: string) => /^[0-9a-f-]{36}$/i.test(s)).slice(0, 5000)

  try {
    switch (body.action) {
      // ── FREE ─────────────────────────────────────────────────────────────
      case 'findCompanies': {
        const r = await findCompanies({ words: String(body.words ?? ''), exclude: String(body.exclude ?? ''), location: String(body.location ?? ''), segment: toSeg(body.segment), max: Number(body.max) || 100 })
        return NextResponse.json({ ok: true, ...r, note: r.added
          ? `Added ${r.added} compan${r.added === 1 ? 'y' : 'ies'} from the register.${r.already ? ` ${r.already} we already had.` : ''}${r.excluded ? ` ${r.excluded} left out by your “but not” words.` : ''}`
          : r.matched ? `Nothing new — all ${r.matched} matching companies are already here or were left out.` : 'The register has no active company with those words in its name.' })
      }
      case 'freeLook':
        return NextResponse.json({ ok: true, ...await freeLookBatch(6) })
      case 'add': {
        const r = await addProspects(ids.length ? ids : undefined)
        return NextResponse.json({ ok: true, ...r, note: `Added ${r.added} to your contacts.${r.held ? ` ${r.held} are held back until you confirm they are a company or organisation.` : ''}${r.dupes ? ` ${r.dupes} were already contacts.` : ''}${r.suppressed ? ` ${r.suppressed} skipped — they unsubscribed or bounced before.` : ''}` })
      }
      case 'accept': {       // an "unsure" email the admin has checked themselves
        await sb.from('outreach_prospects').update({ state: 'found', updated_at: now }).in('id', ids).eq('state', 'unsure')
        return NextResponse.json({ ok: true })
      }
      case 'setEmail': {     // typed in by hand
        const email = (String(body.email ?? '').trim().toLowerCase().match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/) || [])[0]
        if (!email || !ids.length) throw new Error('That does not look like an email address.')
        await sb.from('outreach_prospects').update({ email, state: 'found', updated_at: now }).eq('id', ids[0])
        return NextResponse.json({ ok: true })
      }
      case 'dismiss': {
        await sb.from('outreach_prospects').update({ state: 'dismissed', updated_at: now }).in('id', ids)
        return NextResponse.json({ ok: true })
      }
      case 'clear': {
        // Everything not yet added. Added ones stay, so the same company is not
        // offered again next time; so do dismissed ones, for the same reason.
        const { data, error } = await sb.from('outreach_prospects').update({ state: 'dismissed', updated_at: now }).in('state', ['new', 'no_email', 'unsure', 'found', 'nothing']).select('id')
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true, note: `Cleared ${(data || []).length} from the list. They will not be offered again.` })
      }
      case 'cap': {
        const cap = Math.max(0, Math.min(500, Number(body.cap)))
        if (!Number.isFinite(cap)) throw new Error('Enter a number of dollars.')
        const { error } = await sb.from('outreach_settings').update({ search_cap_usd: cap, updated_at: now }).eq('id', 1)
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true, note: cap ? `Paid searches will stop at $${cap.toFixed(2)} a month.` : 'Paid search is switched off.' })
      }

      // ── PAID — only ever with the admin's explicit confirmation ──────────
      case 'paidLookup':
      case 'paidDiscover': {
        if (body.confirm !== 'paid') return NextResponse.json({ error: 'A paid search has to be confirmed from the page.' }, { status: 400 })
        if (!paidSearchReady()) throw new Error('Paid search is not set up on the server (ANTHROPIC_API_KEY).')
        if (body.action === 'paidLookup') return NextResponse.json({ ok: true, ...await paidLookupBatch({ size: 3, ids: ids.length ? ids : undefined }) })
        const description = String(body.description ?? '').trim()
        if (description.length < 8) throw new Error('Describe who you are looking for, e.g. “padel clubs in the north west with their own coaching team”.')
        const r = await paidDiscover({ description, segment: toSeg(body.segment), count: Number(body.count) || 15 })
        return NextResponse.json({ ok: true, ...r, note: r.added
          ? `Found ${r.added} new organisation${r.added === 1 ? '' : 's'} — ${r.onRegister} confirmed as companies on the register.${r.already ? ` ${r.already} we already had.` : ''} Now run the free look for their emails.`
          : 'The search did not turn up any organisations we do not already have.' })
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e) {
    console.error('[admin/outreach/find]', body.action, e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, { status: 500 })
  }
}
