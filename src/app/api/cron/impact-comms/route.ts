import { NextRequest, NextResponse } from 'next/server'
import { serviceDb } from '@/lib/impact/invite-send'
import { claimCampaign, continueSend, type CampaignRow, type OrgRow } from '@/lib/impact/comms-server'
import { runAutomations } from '@/lib/impact/automation-server'
import { inQuietHours, quietHours } from '@/lib/impact/comms-settings'
import { moduleOn } from '@/lib/impact/org'

export const runtime = 'nodejs'
export const maxDuration = 300

// The Communications scheduler (docs/impact-comms-scheduler.md). A system cron on the VPS
// calls it every five minutes, on localhost (Cloudflare challenges curl on the public host):
//
//   */5 * * * * curl -sS -m 280 -X POST -H "Authorization: Bearer $CRON_SECRET" \
//     http://127.0.0.1:3000/api/cron/impact-comms >> /home/lumio/lumio-cron.log 2>&1
//
// Switches, all in .env.production:
//   IMPACT_COMMS_SCHEDULER=on        without it, a run does nothing ({ off: true })
//   IMPACT_COMMS_SCHEDULER_ORGS=a,b  only these org slugs (unset = every live org)
// ?dry=1 works whatever the switch says: it reports what a run WOULD send — counts per
// org, no names or addresses — and writes and sends nothing (no lease, no run row).
//
// One run: take the lease (two runs never send at once) → per org with Communications on:
// finish newsletters already sending, then (outside quiet hours) send scheduled ones that
// are due and the switched-on automations → log the run → release the lease.
// At most 1,000 newsletter emails a run in all; the rest go next run.

const JOB = 'impact-comms'
const RUN_BUDGET = 1000

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dry = req.nextUrl.searchParams.get('dry') === '1'
  const on = process.env.IMPACT_COMMS_SCHEDULER === 'on'
  const at = new Date()
  if (!on && !dry) return NextResponse.json({ ok: true, off: true, at: at.toISOString() })

  const db = serviceDb()
  const only = (process.env.IMPACT_COMMS_SCHEDULER_ORGS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const { data: orgRows, error: orgErr } = await db.from('impact_orgs').select('hq_id, slug, settings')
  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })
  const orgs = ((orgRows ?? []) as OrgRow[]).filter(o => o.slug !== 'demo' && (!only.length || only.includes(o.slug)) && moduleOn(o.settings ?? {}, 'comms'))
  const scope = only.length ? only : 'all'

  const holder = crypto.randomUUID()
  if (!dry) {
    const { data: got, error } = await db.rpc('impact_scheduler_claim', { p_job: JOB, p_holder: holder, p_seconds: 290 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!got) return NextResponse.json({ ok: true, busy: true, at: at.toISOString() })
  }
  const { data: runRow } = dry ? { data: null } : await db.from('impact_scheduler_runs').insert({ job: JOB }).select('id').single()

  const report: Record<string, unknown>[] = []
  let budget = RUN_BUDGET
  let fatal: string | null = null
  try {
    for (const org of orgs) {
      const quiet = inQuietHours(at, quietHours(org.settings?.messaging))
      const line: Record<string, unknown> = { org: org.slug, quiet }
      const { data: sending } = await db.from('impact_campaigns').select('id, hq_id, status, subject, preheader, sections, audience, scheduled_at').eq('hq_id', org.hq_id).eq('status', 'sending').limit(10)
      const { data: due } = quiet ? { data: [] } : await db.from('impact_campaigns').select('id').eq('hq_id', org.hq_id).eq('status', 'scheduled').lte('scheduled_at', at.toISOString()).order('scheduled_at').limit(10)
      if (dry) {
        line.newslettersSending = sending?.length ?? 0
        line.newslettersDue = due?.length ?? 0
        if (!quiet) {
          const a = await runAutomations(db, org, { dry: true })
          line.automations = { wouldSend: (a.would ?? []).reduce<Record<string, number>>((n, w) => ({ ...n, [w.kind]: (n[w.kind] ?? 0) + 1 }), {}), skipped: a.skipped, waitingForTomorrow: a.waiting }
        }
        report.push(line)
        continue
      }
      const sent: Record<string, unknown>[] = []
      for (const c of (sending ?? []) as CampaignRow[]) {
        if (budget <= 0) break
        const r = await continueSend(db, org, c, budget); budget -= r.sent + r.failed; sent.push({ id: c.id, ...r })
      }
      for (const d of due ?? []) {
        if (budget <= 0) break
        const c = await claimCampaign(db, org.hq_id, d.id as string, ['scheduled'])
        if (!c) continue
        const r = await continueSend(db, org, c, budget); budget -= r.sent + r.failed; sent.push({ id: c.id, scheduled: true, ...r })
      }
      line.newsletters = sent
      if (!quiet) line.automations = await runAutomations(db, org, { dry: false })
      report.push(line)
    }
  } catch (e) {
    fatal = e instanceof Error ? e.message : String(e)
  } finally {
    if (!dry) {
      if (runRow?.id) await db.from('impact_scheduler_runs').update({ finished_at: new Date().toISOString(), counts: { orgs: report }, error: fatal }).eq('id', runRow.id)
      await db.rpc('impact_scheduler_release', { p_job: JOB, p_holder: holder })
    }
  }
  const out = { ok: !fatal, dry, on, scope, at: at.toISOString(), orgs: report, ...(fatal ? { error: fatal } : {}) }
  console.log('[cron/impact-comms]', JSON.stringify(out))
  return NextResponse.json(out, { status: fatal ? 500 : 200 })
}
