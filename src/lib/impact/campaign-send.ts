// Sending a newsletter, in two pure steps the route and the scheduler share:
//
//   planRecipients   the audience at send time → one impact_campaign_recipients row per
//                    family: 'queued', or 'skipped' with the reason (no consent,
//                    unsubscribed, opted out, no email, email bounced)
//   runBatches       the queued rows → Resend batch calls of up to 100, each email with
//                    that family's own unsubscribe link → a status per row: 'sent' with
//                    the provider id, or 'failed' with the error. A batch that fails
//                    fails every row in it and the send carries on with the next one.
//
// A run sends at most `max` rows; whatever is left stays queued for the next run, so a
// big list never holds the cron route past its time limit.

import { skipReason, type AudienceFamily } from './audiences'

export interface PlannedRow { family_id: string; channel: 'email'; status: 'queued' | 'skipped'; skip_reason: string | null }

export function planRecipients(families: AudienceFamily[]): PlannedRow[] {
  const seen = new Set<string>()
  const out: PlannedRow[] = []
  for (const f of families) {
    if (seen.has(f.id)) continue
    seen.add(f.id)
    const why = skipReason(f, 'email')
    out.push({ family_id: f.id, channel: 'email', status: why ? 'skipped' : 'queued', skip_reason: why })
  }
  return out
}

export const chunk = <T,>(xs: T[], n: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

export interface QueuedRow { id: string; family_id: string | null }
export interface OutEmail { to: string; subject: string; html: string; text: string; headers: Record<string, string> }
export interface RowUpdate { id: string; status: 'sent' | 'failed' | 'skipped'; provider_id?: string | null; error?: string | null; skip_reason?: string | null; sent_at?: string | null }

export async function runBatches(o: {
  queued: QueuedRow[]
  families: Map<string, AudienceFamily>
  render: (f: AudienceFamily) => OutEmail
  send: (batch: OutEmail[]) => Promise<{ ids: (string | null)[] } | { error: string }>
  chunkSize?: number
  max?: number
  now?: () => string
}): Promise<{ updates: RowUpdate[]; batches: number; left: number }> {
  const size = Math.min(100, o.chunkSize ?? 100)
  const max = o.max ?? 1000
  const now = o.now ?? (() => new Date().toISOString())
  const take = o.queued.slice(0, max)
  const updates: RowUpdate[] = []
  let batches = 0
  // A family whose consent changed since the plan is skipped now, not sent.
  const ready: { row: QueuedRow; mail: OutEmail }[] = []
  for (const row of take) {
    const f = row.family_id ? o.families.get(row.family_id) : undefined
    const why = f ? skipReason(f, 'email') : 'no consent'
    if (!f || why) { updates.push({ id: row.id, status: 'skipped', skip_reason: f ? why : 'family removed' }); continue }
    ready.push({ row, mail: o.render(f) })
  }
  for (const part of chunk(ready, size)) {
    batches++
    let res: { ids: (string | null)[] } | { error: string }
    try { res = await o.send(part.map(p => p.mail)) } catch (e) { res = { error: e instanceof Error ? e.message : 'Send failed' } }
    const at = now()
    part.forEach((p, i) => {
      if ('error' in res) updates.push({ id: p.row.id, status: 'failed', error: res.error.slice(0, 500) })
      else if (res.ids[i]) updates.push({ id: p.row.id, status: 'sent', provider_id: res.ids[i], sent_at: at })
      else updates.push({ id: p.row.id, status: 'failed', error: 'No id came back for this email' })
    })
  }
  return { updates, batches, left: Math.max(0, o.queued.length - take.length) }
}

export type CampaignCounts = Record<'recipients' | 'queued' | 'sent' | 'delivered' | 'opened' | 'bounced' | 'complained' | 'unsubscribed' | 'failed' | 'skipped', number>

/** Counts for the results tab. A delivered or opened email also counts as sent. */
export function countStatuses(rows: { status: string }[]): CampaignCounts {
  const c: CampaignCounts = { recipients: rows.length, queued: 0, sent: 0, delivered: 0, opened: 0, bounced: 0, complained: 0, unsubscribed: 0, failed: 0, skipped: 0 }
  for (const r of rows) {
    if (r.status in c) c[r.status as keyof CampaignCounts]++
    if (['delivered', 'opened', 'bounced', 'complained', 'unsubscribed'].includes(r.status)) c.sent++
    if (r.status === 'opened' || r.status === 'unsubscribed') c.delivered++
  }
  return c
}

/** A webhook moves a recipient forward, never back: an 'opened' email stays opened when a late 'delivered' arrives. */
const RANK: Record<string, number> = { queued: 0, failed: 1, sent: 2, delivered: 3, opened: 4, bounced: 5, complained: 6, unsubscribed: 7, skipped: -1 }
export const advances = (from: string, to: string) => (RANK[to] ?? 0) > (RANK[from] ?? 0)
