import { NextRequest, NextResponse } from 'next/server'
import {
  adminFor, db, mailbox, linkBase, getSettings, sentToday, todaysLimit, pending, render, deliver, runBatch,
  looksCorporate, eligible, SEGMENTS, MAX_DAILY, type Contact, type Campaign, type Segment,
} from '@/lib/outreach/core'

export const runtime = 'nodejs'
export const maxDuration = 120

// Admin Outreach: contacts, campaigns and sending, for signed-in Lumio admins
// only. Every action goes through adminFor() — a real expiring admin session.
// (The sports-admin area's shared token ships in the browser bundle, which is
// fine for reading a dashboard and not fine for a button that sends email, so
// Outreach deliberately lives under /admin.)

const clean = (v: unknown, max = 300) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const firstEmail = (v: unknown) => (String(v ?? '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '').toLowerCase()

function toSegment(v: unknown): Segment | null {
  const s = clean(v).toLowerCase()
  if ((SEGMENTS as readonly string[]).includes(s)) return s as Segment
  if (/venue|operator|club|leisure|park|centre|center/.test(s)) return 'venue'
  if (/academy|multi|company|business|school/.test(s)) return 'academy'
  if (/coach|solo|independent/.test(s)) return 'coach'
  return null
}

export async function GET(req: NextRequest) {
  if (!await adminFor(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = db()
  const box = mailbox()
  const [settings, today, { data: contacts }, { data: campaigns }, { data: sends }, { data: recent }] = await Promise.all([
    getSettings(), sentToday(),
    sb.from('outreach_contacts').select('*').order('created_at', { ascending: false }).limit(5000),
    sb.from('outreach_campaigns').select('*').order('created_at'),
    sb.from('outreach_sends').select('campaign_id, status').limit(50000),
    sb.from('outreach_sends').select('id, campaign_id, email, status, error, sent_at, created_at').order('created_at', { ascending: false }).limit(60),
  ])
  const list = (contacts || []) as Contact[]
  const camps = await Promise.all(((campaigns || []) as Campaign[]).map(async c => {
    const mine = (sends || []).filter(s => s.campaign_id === c.id)
    const inSegment = list.filter(x => x.segment === c.segment)
    return {
      ...c,
      sent: mine.filter(s => s.status === 'sent').length,
      failed: mine.filter(s => s.status === 'failed').length,
      waiting: (await pending(c)).length,
      held: inSegment.filter(x => x.status === 'active' && !eligible(x)).length,
    }
  }))
  return NextResponse.json({
    // Never the password, never the full settings of the mailbox — just enough to show what is configured.
    mailbox: { ready: box.ready, from: box.ready ? `${box.fromName} <${box.from}>` : '', host: box.host },
    linkBase: linkBase(new URL(req.url).origin),
    settings, sentToday: today, todaysLimit: await todaysLimit(settings), maxDaily: MAX_DAILY, contacts: list, campaigns: camps, recent: recent || [],
  })
}

export async function POST(req: NextRequest) {
  const admin = await adminFor(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = await req.json().catch(() => ({})) as Record<string, any>
  const sb = db()
  const now = new Date().toISOString()

  try {
    switch (body.action) {
      // ── contacts ─────────────────────────────────────────────────────────
      case 'import': {
        const rows = Array.isArray(body.rows) ? body.rows.slice(0, 5000) : []
        const optIn = body.basis === 'opt_in'
        const fallback = toSegment(body.segment)
        const { data: supp } = await sb.from('outreach_suppressions').select('email')
        const { data: have } = await sb.from('outreach_contacts').select('email')
        const blocked = new Set((supp || []).map(s => s.email as string))
        const existing = new Set((have || []).map(s => String(s.email).toLowerCase()))
        const out: Record<string, unknown>[] = []
        let noEmail = 0, dupes = 0, suppressed = 0, held = 0
        for (const r of rows) {
          const email = firstEmail(r.email)
          if (!email) { noEmail++; continue }
          if (blocked.has(email)) { suppressed++; continue }
          if (existing.has(email)) { dupes++; continue }
          existing.add(email)
          const legal = clean(r.legal_form, 60)
          // "Yes – business email…" in the sheet's own PECR column, or a legal
          // form that is plainly a corporate body. Anything else is held until a
          // person confirms it — the default is NOT to email.
          // When the sheet has its own verdict it wins over the legal form, and
          // a conditional yes ("Yes – once a generic address is found") is a no.
          const verdict = clean(r.pecr, 200)
          const ok = optIn ? false : verdict ? (/^yes\b/i.test(verdict) && !/\b(once|after|when|if)\b/i.test(verdict)) : looksCorporate(legal)
          if (!ok && !optIn) held++
          out.push({
            email, org_name: clean(r.org, 200) || null, contact_name: clean(r.contact, 120) || null, role: clean(r.role, 120) || null,
            segment: toSegment(r.segment) || fallback || 'academy', legal_form: legal || null, corporate_ok: ok,
            basis: optIn ? 'opt_in' : 'b2b', website: clean(r.website, 300) || null, source: clean(r.source || body.source, 200) || null,
            notes: clean(r.notes, 1000) || null,
          })
        }
        for (let i = 0; i < out.length; i += 500) {
          const { error } = await sb.from('outreach_contacts').insert(out.slice(i, i + 500))
          if (error) throw new Error(error.message)
        }
        return NextResponse.json({ ok: true, added: out.length, held, dupes, noEmail, suppressed })
      }
      case 'contact': {
        const patch: Record<string, unknown> = { updated_at: now }
        const p = body.patch || {}
        if (typeof p.corporate_ok === 'boolean') patch.corporate_ok = p.corporate_ok
        if (['active', 'replied', 'unsubscribed', 'bounced'].includes(p.status)) patch.status = p.status
        if (toSegment(p.segment)) patch.segment = toSegment(p.segment)
        for (const k of ['org_name', 'contact_name', 'legal_form'] as const) if (typeof p[k] === 'string') patch[k] = clean(p[k], 200) || null
        const { data: c, error } = await sb.from('outreach_contacts').update(patch).eq('id', String(body.id)).select('email, status').maybeSingle()
        if (error) throw new Error(error.message)
        // Marking someone unsubscribed or bounced by hand is as permanent as
        // them pressing the link.
        if (c && (c.status === 'unsubscribed' || c.status === 'bounced')) {
          await sb.from('outreach_suppressions').upsert({ email: String(c.email).toLowerCase(), reason: c.status === 'bounced' ? 'bounced' : 'manual' }, { onConflict: 'email' })
        }
        return NextResponse.json({ ok: true })
      }
      case 'deleteContacts': {
        const ids = (Array.isArray(body.ids) ? body.ids : []).map(String).slice(0, 5000)
        if (!ids.length) return NextResponse.json({ ok: true, removed: 0 })
        const { data, error } = await sb.from('outreach_contacts').delete().in('id', ids).select('id')
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true, removed: (data || []).length })
      }

      // ── campaigns ────────────────────────────────────────────────────────
      case 'campaign': {
        const seg = toSegment(body.segment)
        const url = (v: unknown) => { const u = clean(v, 600); return /^https?:\/\//i.test(u) || u.startsWith('/') ? u : null }
        const row = {
          name: clean(body.name, 120), segment: seg, subject: clean(body.subject, 200), body: String(body.body ?? '').slice(0, 8000), updated_at: now,
          style: body.style === 'designed' ? 'designed' : 'plain', headline: clean(body.headline, 160) || null,
          image_url: url(body.image_url), button_text: clean(body.button_text, 60) || null, button_url: url(body.button_url),
        }
        if (!row.name || !seg) return NextResponse.json({ error: 'A campaign needs a name and an audience.' }, { status: 400 })
        const q = body.id
          ? sb.from('outreach_campaigns').update(row).eq('id', String(body.id)).select('id').maybeSingle()
          : sb.from('outreach_campaigns').insert(row).select('id').maybeSingle()
        const { data, error } = await q
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true, id: data?.id })
      }
      case 'campaignStatus': {
        if (!['draft', 'active', 'paused'].includes(body.status)) return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
        if (body.status === 'active') {
          const { data: c } = await sb.from('outreach_campaigns').select('subject, body').eq('id', String(body.id)).maybeSingle()
          if (!c?.subject?.trim() || !c?.body?.trim()) return NextResponse.json({ error: 'Write the subject and the email before starting it.' }, { status: 400 })
        }
        const { error } = await sb.from('outreach_campaigns').update({ status: body.status, updated_at: now }).eq('id', String(body.id))
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true })
      }
      case 'deleteCampaign': {
        const { error } = await sb.from('outreach_campaigns').delete().eq('id', String(body.id))
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true })
      }

      // ── settings ─────────────────────────────────────────────────────────
      case 'settings': {
        const patch: Record<string, unknown> = { updated_at: now }
        if (typeof body.company_line === 'string') patch.company_line = clean(body.company_line, 400)
        if (body.daily_limit !== undefined && Number.isFinite(Number(body.daily_limit))) patch.daily_limit = Math.max(0, Math.min(MAX_DAILY, Math.round(Number(body.daily_limit))))
        if (typeof body.warmup === 'boolean') patch.warmup = body.warmup
        if (typeof body.paused === 'boolean') patch.paused = body.paused
        const { error } = await sb.from('outreach_settings').update(patch).eq('id', 1)
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true })
      }

      // ── sending ──────────────────────────────────────────────────────────
      case 'preview':
      case 'test': {
        const settings = await getSettings()
        const base = linkBase(new URL(req.url).origin)
        const seg = toSegment(body.segment) || 'academy'
        const { data: real } = await sb.from('outreach_contacts').select('*').eq('segment', seg).eq('status', 'active').limit(1).maybeSingle()
        const sample = (real as Contact | null) || {
          id: 'sample', email: admin.email, org_name: 'Riverside Tennis Club', contact_name: 'Sam Carter', role: null, segment: seg,
          legal_form: 'Ltd', corporate_ok: true, basis: 'b2b', website: null, source: null, notes: null, status: 'active',
          unsub_token: '00000000-0000-0000-0000-000000000000', created_at: now,
        } as Contact
        const m = render(sample, {
          subject: String(body.subject ?? ''), body: String(body.body ?? ''), style: body.style === 'designed' ? 'designed' : 'plain',
          headline: clean(body.headline, 160), image_url: clean(body.image_url, 600), button_text: clean(body.button_text, 60), button_url: clean(body.button_url, 600),
        }, settings, base)
        if (body.action === 'preview') return NextResponse.json({ ok: true, subject: m.subject, html: m.html, as: sample.org_name || sample.email })
        // A test only ever goes to the admin who pressed the button — the test
        // button must not be a way to send one-off mail to anyone.
        const res = await deliver(admin.email, { subject: `[TEST] ${m.subject}`, text: m.text, html: m.html })
        if (!res.ok) return NextResponse.json({ error: `Could not send the test: ${res.error || 'unknown error'}` }, { status: 502 })
        return NextResponse.json({ ok: true, to: admin.email })
      }
      case 'sendNow': {
        const result = await runBatch({ max: Math.max(1, Math.min(8, Number(body.max) || 5)), reqOrigin: new URL(req.url).origin, respectHours: false })
        return NextResponse.json({ ok: true, ...result })
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e) {
    console.error('[admin/outreach]', body.action, e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, { status: 500 })
  }
}
