import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { AUTOMATION_KINDS, type AutomationKind, type AutomationRow } from '@/lib/impact/automations'
import { previewAutomations } from '@/lib/impact/automation-server'
import { brandFor, type ImpactOrgSettings } from '@/lib/impact/org'

export const runtime = 'nodejs'

// "Who would receive it today": the automation as it stands (or as edited, unsaved),
// worked out by the same selectAutomations the scheduler uses — including the
// one-a-day cap across all the org's switched-on automations. Sends nothing.
// Returns names, never addresses.

export async function POST(req: NextRequest) {
  const auth = await impactHq('preview automations')
  if (auth instanceof NextResponse) return auth
  const { db, hqId } = auth
  const raw = (await req.json().catch(() => ({}))) as { kind?: unknown; config?: unknown }
  const kind = String(raw.kind) as AutomationKind
  if (!AUTOMATION_KINDS.includes(kind)) return NextResponse.json({ error: 'Unknown automation.' }, { status: 400 })
  const { data: org } = await db.from('impact_orgs').select('slug, settings').eq('hq_id', hqId).maybeSingle()
  if (!org) return NextResponse.json({ error: 'This login isn’t linked to an organisation yet.' }, { status: 403 })
  const { data: saved } = await db.from('impact_automations').select('id, kind, enabled, config').eq('hq_id', hqId)
  const rows: AutomationRow[] = (saved ?? []).map(r => ({ id: r.id as string, kind: r.kind as AutomationKind, enabled: !!r.enabled, config: (r.config ?? {}) as AutomationRow['config'] }))
  // The one previewed counts as on, with its edited config; welcome previews from today if never switched on.
  const config = (raw.config && typeof raw.config === 'object' ? raw.config : rows.find(r => r.kind === kind)?.config ?? {}) as AutomationRow['config']
  const own: AutomationRow = { id: rows.find(r => r.kind === kind)?.id ?? 'preview', kind, enabled: true, config: kind === 'welcome' && !config.since ? { ...config, since: new Date().toISOString() } : config }
  const list = [...rows.filter(r => r.kind !== kind), own]
  try {
    const sel = await previewAutomations(db, hqId, brandFor(org.slug as string, org.settings as ImpactOrgSettings).org, list)
    const mine = <T extends { kind: string }>(xs: T[]) => xs.filter(x => x.kind === kind)
    return NextResponse.json({
      send: mine(sel.send).map(c => ({ name: c.guardian, step: c.step, subject: c.subject, body: c.body })),
      waiting: mine(sel.waiting).map(c => ({ name: c.guardian, step: c.step })),
      skipped: mine(sel.skipped).map(c => ({ name: c.guardian, step: c.step, reason: c.reason })),
    })
  } catch (e) {
    console.error('[impact/comms/automations]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'The preview couldn’t be worked out just now. Please try again.' }, { status: 503 })
  }
}
