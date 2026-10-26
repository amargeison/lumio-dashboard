import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { readIncoming } from '@/lib/coach/leads'
import { nudgeCoach } from '@/lib/app/push'

export const runtime = 'nodejs'

// Leads arriving from an automation: POST /api/leads/in/<the academy's token>.
//
// Accepts one lead or a list, as JSON or a form — the field names Meta's lead
// ads use (full_name, email, phone_number, field_data…), or plain ones (name,
// email, phone, message). A person already in the leads list with the same
// email or phone in the same pipeline in the last 60 days gets a note added
// instead of a second card. Each new lead lands at "Enquired", source "Meta ad"
// (or whatever `source` says).

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/
const MAX = 50
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

async function hookFor(token: string) {
  if (!TOKEN_RE.test(token)) return null
  const { data } = await db().from('coach_lead_hooks').select('coach_id').eq('token', token).maybeSingle()
  return (data?.coach_id as string) || null
}

// Some tools check the address with a GET first.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (await hookFor(token))
    ? NextResponse.json({ ok: true, message: 'Send leads here with POST (JSON or form fields: name, email, phone, message).' })
    : NextResponse.json({ error: 'Unknown address.' }, { status: 404 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const gate = rateLimit(`leads-in:${token}`, 120, 60 * 60_000)
  if (!gate.ok) return NextResponse.json({ error: 'Too many leads at once. Try again shortly.' }, { status: 429 })
  const coachId = await hookFor(token)
  if (!coachId) return NextResponse.json({ error: 'Unknown address.' }, { status: 404 })

  const raw = await req.text()
  if (raw.length > 100_000) return NextResponse.json({ error: 'That is too much at once.' }, { status: 413 })
  let body: unknown = null
  const type = req.headers.get('content-type') || ''
  if (type.includes('application/x-www-form-urlencoded')) body = Object.fromEntries(new URLSearchParams(raw))
  else { try { body = JSON.parse(raw) } catch { body = Object.fromEntries(new URLSearchParams(raw)) } }
  const items = (Array.isArray(body) ? body : (body as { leads?: unknown[] } | null)?.leads && Array.isArray((body as { leads: unknown[] }).leads) ? (body as { leads: unknown[] }).leads : [body]).slice(0, MAX)

  const sb = db()
  let created = 0, updated = 0, skipped = 0
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString()
  for (const item of items) {
    const lead = readIncoming(item)
    if (!lead) { skipped++; continue }
    const source = String((item as Record<string, unknown>)?.source || 'Meta ad').slice(0, 40)
    // Already here? Same email or phone, same pipeline, recently.
    // Quoted, so a phone number with spaces or brackets is read as one value.
    const q = (v: string) => `"${v.replace(/["\\]/g, '')}"`
    const matches = [lead.email ? `email.eq.${q(lead.email)}` : '', lead.phone ? `phone.eq.${q(lead.phone)}` : ''].filter(Boolean).join(',')
    const { data: dup } = matches
      ? await sb.from('coach_leads').select('id, notes').eq('coach_id', coachId).eq('pipeline', lead.pipeline).gte('created_at', since).or(matches).limit(1)
      : { data: [] }
    const stamp = new Date().toISOString().slice(0, 10)
    if (dup?.length) {
      const note = `[${stamp}] Enquired again${lead.campaign ? ` (${lead.campaign})` : ''}${lead.message ? `: ${lead.message}` : ''}`
      await sb.from('coach_leads').update({ notes: [dup[0].notes, note].filter(Boolean).join('\n').slice(0, 5000), updated_at: new Date().toISOString() }).eq('id', dup[0].id)
      updated++
      continue
    }
    const { data: row, error } = await sb.from('coach_leads').insert({
      coach_id: coachId, pipeline: lead.pipeline, stage: 'Enquired', name: lead.name, for_name: lead.forName,
      email: lead.email, phone: lead.phone, source, campaign: lead.campaign, message: lead.message,
    }).select('id').single()
    if (error || !row) { skipped++; continue }
    await sb.from('coach_lead_events').insert({ coach_id: coachId, lead_id: row.id, kind: 'created', to_stage: 'Enquired', points: 0, text: `From ${source}` })
    if (created < 3) await nudgeCoach(sb, coachId, { title: 'New lead', body: [lead.name, lead.forName ? `for ${lead.forName}` : '', lead.message ? `: ${lead.message}` : ''].filter(Boolean).join(' ').replace(' :', ':') })
    created++
  }
  await sb.from('coach_lead_hooks').update({ last_used_at: new Date().toISOString() }).eq('coach_id', coachId)
  return NextResponse.json({ ok: true, created, updated, skipped })
}
