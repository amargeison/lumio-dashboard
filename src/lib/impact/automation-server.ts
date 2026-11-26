// Automations, server side: load what selectAutomations needs for one org, and (for the
// scheduler) send what it chose. Reads work with the HQ's own session (the preview) or
// the service role (the scheduler); every query matches hq_id.
//
// Sending is claim-then-send: a row goes into impact_automation_sends first ('claimed'),
// and its two unique indexes — one per automation+family+step, one per family per UK
// day — mean a step can't go twice and a family can't get two in a day, even if two
// runs overlapped. Only then is the email sent, logged in impact_messages (so it shows
// in the family's thread and app), and the claim marked sent or failed.

import type { SupabaseClient } from '@supabase/supabase-js'
import { selectAutomations, type AutomationKind, type AutomationRow, type AutomationWorld, type Selection } from './automations'
import { FAMILY_COLS, mailerFor, ukToday, type OrgRow } from './comms-server'
import { addDays, ukClock } from './comms-settings'
import { brandFor } from './org'
import type { AudienceFamily } from './audiences'

export async function loadAutomations(db: SupabaseClient, hqId: string): Promise<AutomationRow[]> {
  const { data, error } = await db.from('impact_automations').select('id, kind, enabled, config').eq('hq_id', hqId)
  if (error) throw new Error(`impact_automations: ${error.message}`)
  return (data ?? []).map(r => ({ id: r.id as string, kind: r.kind as AutomationKind, enabled: !!r.enabled, config: (r.config ?? {}) as AutomationRow['config'] }))
}

export async function loadWorld(db: SupabaseClient, hqId: string, orgName: string, at = new Date()): Promise<AutomationWorld> {
  const today = ukToday(at)
  const clock = ukClock(at)
  const q = async <T,>(label: string, p: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> => {
    const { data, error } = await p
    if (error) throw new Error(`${label}: ${error.message}`)
    return (data ?? []) as T[]
  }
  const [families, children, programmes, sessions, packIssues, venues, booklet, sends] = await Promise.all([
    q<AudienceFamily>('tp_families', db.from('tp_families').select(FAMILY_COLS).eq('hq_id', hqId).limit(20000)),
    q<AutomationWorld['children'][number]>('tp_children', db.from('tp_children').select('id, family_id, programme_id, school_id').eq('hq_id', hqId).limit(50000)),
    q<AutomationWorld['programmes'][number]>('tp_programmes', db.from('tp_programmes').select('id, school_id, current_week').eq('hq_id', hqId)),
    q<AutomationWorld['sessions'][number]>('tp_sessions', db.from('tp_sessions').select('id, kind, programme_id, venue_id, session_date').eq('hq_id', hqId).gte('session_date', addDays(today, -60)).lte('session_date', addDays(today, 7)).limit(5000)),
    q<AutomationWorld['packIssues'][number]>('tp_pack_issues', db.from('tp_pack_issues').select('id, child_id, issued_at').eq('hq_id', hqId).gte('issued_at', `${addDays(today, -3)}T00:00:00Z`).limit(5000)),
    q<AutomationWorld['venues'][number]>('tp_venues', db.from('tp_venues').select('id, name, session_time').eq('hq_id', hqId)),
    db.from('tp_booklet').select('weeks').eq('hq_id', hqId).maybeSingle(),
    q<{ automation_id: string; family_id: string; step: string; status: string; send_date: string }>('impact_automation_sends', db.from('impact_automation_sends').select('automation_id, family_id, step, status, send_date').eq('hq_id', hqId).gte('created_at', new Date(at.getTime() - 120 * 86_400_000).toISOString()).limit(50000)),
  ])
  const sessionIds = sessions.map(s => s.id)
  const attendance: AutomationWorld['attendance'] = []
  for (let i = 0; i < sessionIds.length; i += 200) {
    attendance.push(...await q<AutomationWorld['attendance'][number]>('tp_attendance', db.from('tp_attendance').select('session_id, child_id, present').eq('hq_id', hqId).in('session_id', sessionIds.slice(i, i + 200)).limit(20000)))
  }
  return {
    today, weekday: clock.weekday, org: orgName,
    families, children, programmes, sessions, attendance, packIssues, venues,
    bookletWeeks: ((booklet.data?.weeks ?? []) as AutomationWorld['bookletWeeks']),
    done: new Set(sends.map(s => `${s.automation_id}|${s.family_id}|${s.step}`)),
    usedToday: new Set(sends.filter(s => s.send_date === today && s.status !== 'skipped').map(s => s.family_id)),
  }
}

export async function previewAutomations(db: SupabaseClient, hqId: string, orgName: string, rows: AutomationRow[]): Promise<Selection> {
  return selectAutomations(rows, await loadWorld(db, hqId, orgName))
}

/** The scheduler's step for one org. dry → what would happen, nothing written or sent. */
export async function runAutomations(service: SupabaseClient, org: OrgRow, opts: { dry: boolean; max?: number }): Promise<{ sent: number; failed: number; skipped: number; waiting: number; would?: { kind: string; step: string; family: string }[]; error?: string }> {
  const rows = (await loadAutomations(service, org.hq_id)).filter(a => a.enabled)
  if (!rows.length) return { sent: 0, failed: 0, skipped: 0, waiting: 0 }
  const brand = brandFor(org.slug, org.settings)
  const world = await loadWorld(service, org.hq_id, brand.org)
  const sel = selectAutomations(rows, world)
  const max = opts.max ?? 300
  if (opts.dry) return { sent: 0, failed: 0, skipped: sel.skipped.length, waiting: sel.waiting.length, would: sel.send.slice(0, max).map(c => ({ kind: c.kind, step: c.step, family: c.familyId })) }

  // Skips are recorded so they aren't re-checked every five minutes; they don't use the day.
  for (const s of sel.skipped) {
    await service.from('impact_automation_sends').insert({ hq_id: org.hq_id, automation_id: s.automationId, family_id: s.familyId, step: s.step, send_date: world.today, status: 'skipped', detail: s.reason })
  }
  if (!sel.send.length) return { sent: 0, failed: 0, skipped: sel.skipped.length, waiting: sel.waiting.length }
  const mailer = await mailerFor(org)
  if ('error' in mailer) return { sent: 0, failed: 0, skipped: sel.skipped.length, waiting: sel.waiting.length + sel.send.length, error: mailer.error }
  const fams = new Map(world.families.map(f => [f.id, f]))
  let sent = 0, failed = 0
  for (const c of sel.send.slice(0, max)) {
    // The claim. A unique-index clash means another run (or an earlier step today) got there first.
    const { data: claim, error: claimErr } = await service.from('impact_automation_sends')
      .insert({ hq_id: org.hq_id, automation_id: c.automationId, family_id: c.familyId, step: c.step, send_date: world.today, status: 'claimed' }).select('id').single()
    if (claimErr || !claim) continue
    const f = fams.get(c.familyId)!
    const mail = mailer.build(f, { subject: c.subject, preheader: '', sections: [{ headline: '', body: c.body }] })
    const res = await mailer.send([mail])
    const providerId = 'ids' in res ? res.ids[0] : null
    const ok = !!providerId
    const { data: msg } = await service.from('impact_messages').insert({
      hq_id: org.hq_id, thread_key: `family:${f.id}`, family_id: f.id, channel: 'email', direction: 'out', subject: c.subject, body: c.body,
      status: ok ? 'sent' : 'failed', detail: ok ? `Automation: ${c.kind}` : ('error' in res ? res.error : 'No id came back').slice(0, 500), provider_id: providerId,
    }).select('id').single()
    await service.from('impact_automation_sends').update({ status: ok ? 'sent' : 'failed', message_id: msg?.id ?? null, detail: ok ? null : ('error' in res ? res.error.slice(0, 300) : 'No id came back') }).eq('id', claim.id).eq('hq_id', org.hq_id)
    if (ok) sent++; else failed++
  }
  return { sent, failed, skipped: sel.skipped.length, waiting: sel.waiting.length + Math.max(0, sel.send.length - max) }
}
