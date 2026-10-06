import type { Metadata } from 'next'
import { demoAttendeeByFormToken } from '@/lib/coach/demo-public'
import { createClient } from '@supabase/supabase-js'
import { askedForm, formEnabled, formOutstanding, type Answers } from '@/lib/coach/camp-form'
import CampFormView, { type FormPublic } from './CampFormView'

// ─── PUBLIC PLAYER-INFORMATION FORM ─────────────────────────────────────────
// URL: /camp/form/[token] — one link per attendee, sent with their sign-up
// confirmation and the countdown emails.
//
// The token is the only key. It identifies one attendee on one camp, so the
// page can only ever show that person's own answers back to them, and what
// they submit can only land on their own row. As on the sign-up page, an
// allow-list (`toPublic`) decides what leaves the server: the camp's name,
// dates and questions — never its run-sheet, costs or other families.

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Player information', robots: { index: false, follow: false } }

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

async function load(token: string): Promise<FormPublic | 'closed' | null> {
  if (!/^[a-f0-9]{32,80}$/i.test(token)) return null
  try {
    const sb = db()
    const { data: a } = await sb.from('coach_camp_attendees')
      .select('id, camp_id, coach_id, player_name, parent_phone, status, form_answers, form_submitted_at').eq('form_token', token).maybeSingle()
    if (a?.status === 'cancelled') return null
    // Not in the database: it may be one of the DEMO academy's links.
    const demo = a ? null : demoAttendeeByFormToken(token)
    if (!a && !demo) return null
    const who = (a || demo!.attendee) as { player_name: string; parent_phone?: string | null; form_answers?: unknown; form_submitted_at?: string | null }
    const [{ data: camp }, { data: profile }] = a
      ? await Promise.all([
          sb.from('coach_camps').select('name, start_date, end_date, location, region, audience, overseas, info_form').eq('id', a.camp_id).maybeSingle(),
          sb.from('sports_profiles').select('brand_name, brand_logo_url, display_name').eq('id', a.coach_id).maybeSingle(),
        ])
      : [{ data: demo!.camp }, { data: demo!.profile }]
    if (!camp) return null
    // Switched off by the coach, or the camp finished more than a fortnight ago.
    const ended = camp.end_date || camp.start_date
    if (!formEnabled(camp) || (ended && Date.now() > new Date(`${ended}T23:59:59`).getTime() + 14 * 86400000)) return 'closed'
    const form = askedForm(camp)
    // A form not yet sent starts with what the family already gave at sign-up —
    // the player's name and their mobile number — rather than asking them to
    // type both again. Only into empty boxes, and they can still change them.
    const answers = { ...((who.form_answers || {}) as Answers) }
    if (!who.form_submitted_at) {
      const given: Record<string, string> = { full_name: String(who.player_name || '').trim(), phone: String(who.parent_phone || '').trim() }
      for (const sec of form.sections) for (const q of sec.questions) {
        if (q.key && given[q.key] && answers[q.id] == null) answers[q.id] = given[q.key]
      }
    }
    return {
      token, playerName: who.player_name,
      academy: profile?.brand_name || 'Tennis camp', logoUrl: profile?.brand_logo_url || null, coachName: profile?.display_name || null,
      campName: camp.name, startDate: camp.start_date || null, endDate: camp.end_date || null,
      location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
      adult: camp.audience === 'adult',
      intro: form.intro || null, sections: form.sections,
      answers, submittedAt: who.form_submitted_at || null,
      // Questions the coach has added (or made required) since they sent it.
      stillNeeded: who.form_submitted_at ? formOutstanding(camp, who) : [],
    }
  } catch { return null }
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await load(token)
  if (!data || data === 'closed') {
    return (
      <div style={{ minHeight: '100vh', background: '#eef0f5', display: 'grid', placeItems: 'center', padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" }}>
        <div style={{ maxWidth: 420, background: '#fff', borderRadius: 16, padding: '28px 26px', textAlign: 'center', boxShadow: '0 2px 12px rgba(20,25,40,.07)' }}>
          <h1 style={{ fontSize: 20, margin: '0 0 8px', color: '#1a1d29' }}>{data === 'closed' ? 'This form is closed' : 'This link does not work'}</h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#6b7280', margin: 0 }}>
            {data === 'closed' ? 'The camp is no longer collecting player information. If you need to tell your coach something, reply to any of their emails.' : 'Check you have the whole link from your email. If it still does not open, reply to the email and your coach will send a new one.'}
          </p>
        </div>
      </div>
    )
  }
  return <CampFormView data={data} />
}
