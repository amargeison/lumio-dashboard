// Settings → Data → "Export everything": the rules, kept pure so they can be tested.
//
//   • One CSV per table, only this org's rows (every table here has hq_id).
//   • Left out on purpose: login tokens (impact_invites, impact_lead_hooks) and the
//     export history itself.
//   • Cells that a spreadsheet would run as a formula (= + - @, tab, CR) get a leading '.
//   • The link lasts EXPORT_DAYS; after that the scheduler deletes the ZIP and marks the
//     row expired (expireExports in export-server.ts).
//   • Only the org's HQ or an admin can ask for one, and the link is emailed only to the
//     requester's own sign-in address: the route never reads an address from the request.

export const EXPORT_DAYS = 7
/** Per table, so one huge table can't make the ZIP unbounded. */
export const EXPORT_ROW_CAP = 100_000
/** One export at a time per org, and a few a day. */
export const EXPORT_GAP_MINUTES = 10
export const EXPORT_DAILY_MAX = 5

/** Tables in the export, with the column(s) that give a stable order for paging. */
export const EXPORT_TABLES: { table: string; order: string[] }[] = [
  ...[
    'tp_venues', 'tp_staff', 'tp_schools', 'tp_programmes', 'tp_sessions', 'tp_families', 'tp_children', 'tp_attendance',
    'tp_volunteers', 'tp_community_signups', 'tp_weekend_intents', 'tp_cpd', 'tp_qr_checkins', 'tp_impact_responses',
    'tp_funder_reports', 'tp_pathway_referrals', 'tp_fundraising_campaigns', 'tp_fundraising_events', 'tp_fundraising_pledges',
    'tp_donations', 'tp_pack_items', 'tp_pack_stock', 'tp_pack_stock_moves', 'tp_pack_issues', 'tp_pack_payments',
    'impact_leads', 'impact_lead_events', 'impact_messages', 'impact_campaigns', 'impact_campaign_recipients',
    'impact_automations', 'impact_automation_sends', 'impact_imports', 'impact_members', 'impact_settings_log', 'impact_ai_usage',
  ].map(table => ({ table, order: ['id'] })),
  { table: 'impact_orgs', order: ['hq_id'] },
  { table: 'tp_booklet', order: ['hq_id'] },
  { table: 'tp_booklet_notes', order: ['child_id', 'week'] },
  { table: 'tp_booklet_scorecards', order: ['family_id'] },
  { table: 'tp_pack_sizes', order: ['child_id', 'item_id'] },
  { table: 'impact_threads', order: ['thread_key'] },
]
export const NOT_EXPORTED = ['impact_invites', 'impact_lead_hooks', 'impact_exports'] as const

/** One cell: objects as JSON, quoted when needed, formula-looking text defused. */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  if (/^[=+\-@\t\r]/.test(s) && !(typeof v === 'number')) s = `'${s}`
  return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Rows → CSV text (header from every key seen, first-seen order). Empty table → header only, if known. */
export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? [...new Set(rows.flatMap(r => Object.keys(r)))]
  const lines = [cols.map(csvCell).join(','), ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))]
  return '﻿' + lines.join('\r\n') + '\r\n'   // BOM: Excel reads it as UTF-8
}

export const exportPath = (hqId: string, id: string) => `${hqId}/${id}.zip`

/** The README at the top of the ZIP. */
export function exportReadme(o: { org: string; at: Date; counts: Record<string, number>; truncated: string[] }): string {
  const when = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', dateStyle: 'long', timeStyle: 'short' }).format(o.at)
  return [
    `${o.org}: everything in Lumio Impact, exported ${when} (UK time).`,
    '',
    'One CSV per table. Dates are UTC. Lists and settings are written as JSON inside a cell.',
    'Cells that start with = + - or @ have a leading \' so a spreadsheet shows them as text.',
    'Not included: login tokens and invite codes.',
    '',
    ...Object.entries(o.counts).map(([t, n]) => `${t}.csv  ${n} row${n === 1 ? '' : 's'}${o.truncated.includes(t) ? ` (first ${EXPORT_ROW_CAP.toLocaleString('en-GB')} only)` : ''}`),
    '',
  ].join('\r\n')
}

export interface ExportRow { id: string; hq_id: string; status: string; path: string | null; created_at: string; expires_at: string }

/** What the scheduler should do with each export now: expire it, fail a stuck build, or leave it. */
export function exportAction(r: ExportRow, now: Date): 'expire' | 'fail' | null {
  if (r.status === 'ready' && Date.parse(r.expires_at) <= now.getTime()) return 'expire'
  if (r.status === 'building' && Date.parse(r.created_at) <= now.getTime() - 60 * 60_000) return 'fail'
  if (r.status === 'failed' && r.path && Date.parse(r.expires_at) <= now.getTime()) return 'expire'
  return null
}

/** May this org start another export now? (newest first) */
export function exportAllowed(recent: { status: string; created_at: string }[], now: Date): { ok: true } | { ok: false; error: string } {
  const t = now.getTime()
  if (recent.some(r => r.status === 'building' && Date.parse(r.created_at) > t - 60 * 60_000)) return { ok: false, error: 'An export is already being made. It’ll be in your inbox in a minute or two.' }
  if (recent.some(r => Date.parse(r.created_at) > t - EXPORT_GAP_MINUTES * 60_000)) return { ok: false, error: `You made an export in the last ${EXPORT_GAP_MINUTES} minutes. Please use that one, or try again shortly.` }
  if (recent.filter(r => Date.parse(r.created_at) > t - 24 * 60 * 60_000).length >= EXPORT_DAILY_MAX) return { ok: false, error: `That’s ${EXPORT_DAILY_MAX} exports today, the daily limit. Please try again tomorrow.` }
  return { ok: true }
}

export function exportEmail(o: { org: string; link: string; expires: Date }) {
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
  const until = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long' }).format(o.expires)
  return {
    subject: `Your ${o.org} data export is ready`,
    html:
      `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;">`
      + `<p>The export you asked for is ready: one ZIP with a spreadsheet (CSV) for each part of ${esc(o.org)}’s records.</p>`
      + `<p><a href="${esc(o.link)}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold;">Download the export</a></p>`
      + `<p style="color:#6b7280;font-size:12px;">You’ll need to be signed in to Lumio Impact as yourself. The link works until ${esc(until)}; after that the file is deleted. It holds personal information about families and children, so please store it securely and don’t forward this email.</p>`
      + `</div>`,
  }
}
