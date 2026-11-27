// "Export everything", server side (rules in exports.ts). Service key throughout: the
// caller has already checked who is asking (the route) or is the scheduler.
//
//   buildExport    one row 'building' → every table's rows for this org → ZIP → the private
//                  impact-exports bucket → row 'ready' (or 'failed', with no file kept)
//   emailExport    the download link, to the requester's own sign-in address only
//   expireExports  the scheduler: ZIPs past their 7 days are deleted and the row marked
//                  expired; a build stuck for an hour is marked failed

import type { SupabaseClient } from '@supabase/supabase-js'
import { createZip } from './zip'
import { EXPORT_DAYS, EXPORT_ROW_CAP, EXPORT_TABLES, exportAction, exportEmail, exportPath, exportReadme, toCsv, type ExportRow } from './exports'
import { verifiedSender } from './comms-rules'
import { impactReplyTo } from './inbound'

export const EXPORT_BUCKET = 'impact-exports'
const PAGE = 1000

async function tableRows(db: SupabaseClient, table: string, order: string[], hqId: string): Promise<{ rows: Record<string, unknown>[]; truncated: boolean }> {
  const rows: Record<string, unknown>[] = []
  for (let from = 0; from < EXPORT_ROW_CAP; from += PAGE) {
    let q = db.from(table).select('*').eq('hq_id', hqId)
    for (const o of order) q = q.order(o, { ascending: true })
    const { data, error } = await q.range(from, Math.min(from + PAGE, EXPORT_ROW_CAP) - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...((data ?? []) as Record<string, unknown>[]))
    if ((data ?? []).length < PAGE) return { rows, truncated: false }
  }
  return { rows, truncated: true }
}

export interface Requester { id: string; email: string }

export async function buildExport(db: SupabaseClient, org: { hqId: string; name: string }, by: Requester, at = new Date()):
  Promise<{ ok: true; id: string; expiresAt: string; counts: Record<string, number> } | { ok: false; error: string }> {
  const expiresAt = new Date(at.getTime() + EXPORT_DAYS * 86_400_000).toISOString()
  const { data: row, error } = await db.from('impact_exports').insert({ hq_id: org.hqId, requested_by: by.id, status: 'building', expires_at: expiresAt }).select('id').single()
  if (error || !row) return { ok: false, error: 'The export couldn’t be started. Please try again.' }
  const id = row.id as string
  try {
    const counts: Record<string, number> = {}, truncated: string[] = [], files: { name: string; data: string }[] = []
    for (const t of EXPORT_TABLES) {
      const r = await tableRows(db, t.table, t.order, org.hqId)
      counts[t.table] = r.rows.length
      if (r.truncated) truncated.push(t.table)
      files.push({ name: `${t.table}.csv`, data: toCsv(r.rows) })
    }
    const zip = createZip([{ name: 'README.txt', data: exportReadme({ org: org.name, at, counts, truncated }) }, ...files], at)
    const path = exportPath(org.hqId, id)
    const up = await db.storage.from(EXPORT_BUCKET).upload(path, zip, { contentType: 'application/zip', upsert: false })
    if (up.error) throw new Error(`upload: ${up.error.message}`)
    const done = await db.from('impact_exports').update({ status: 'ready', path, bytes: zip.length, tables: counts, ready_at: new Date().toISOString() }).eq('id', id)
    if (done.error) { await db.storage.from(EXPORT_BUCKET).remove([path]); throw new Error(done.error.message) }
    return { ok: true, id, expiresAt, counts }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[impact/export] build failed', msg)
    await db.from('impact_exports').update({ status: 'failed', error: msg.slice(0, 500) }).eq('id', id)
    return { ok: false, error: 'The export couldn’t be made. Please try again, or email Lumio support.' }
  }
}

// IMPACT_EXPORTS_EMAIL=dry: local testing only, never set on the server (like IMPACT_COMMS_DRY).
// Nothing is emailed; the link goes back in the response to the requester, who still has to
// be signed in as themselves to use it.
const exportsDry = () => process.env.IMPACT_EXPORTS_EMAIL === 'dry'

/** Emails the link to the requester's own sign-in address. Dry (local only): nothing sent, the link comes back. */
export async function emailExport(o: { slug: string; org: string; to: string; link: string; expiresAt: string }): Promise<{ ok: true; link?: string } | { ok: false; error: string }> {
  if (exportsDry()) return { ok: true, link: o.link }
  const address = verifiedSender(o.slug, process.env.IMPACT_EMAIL_SENDERS) || process.env.IMPACT_SYSTEM_SENDER || null
  if (!address || !process.env.RESEND_API_KEY) return { ok: false, error: 'Email isn’t set up for your organisation yet, so the export link can’t be sent. Please email Lumio support.' }
  const mail = exportEmail({ org: o.org, link: o.link, expires: new Date(o.expiresAt) })
  try {
    const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: `${o.org.replace(/["<>\\]/g, '')} <${address}>`, to: o.to, subject: mail.subject, html: mail.html, ...(impactReplyTo(o.slug) ? { replyTo: impactReplyTo(o.slug)! } : {}) })
    if (error) { console.error('[impact/export] email failed →', `@${o.to.split('@')[1]}:`, error.message); return { ok: false, error: 'The export was made but the email couldn’t be sent. Please try again.' } }
    console.log('[impact/export] emailed →', `@${o.to.split('@')[1]}`)
    return { ok: true }
  } catch (e) {
    console.error('[impact/export] email failed', e instanceof Error ? e.message : e)
    return { ok: false, error: 'The export was made but the email couldn’t be sent. Please try again.' }
  }
}

/** The scheduler's tidy-up, every org. Dry: counts what it would do and changes nothing. */
export async function expireExports(db: SupabaseClient, now = new Date(), opts: { dry?: boolean } = {}): Promise<{ expired: number; failed: number; errors: number }> {
  const out = { expired: 0, failed: 0, errors: 0 }
  const { data, error } = await db.from('impact_exports').select('id, hq_id, status, path, created_at, expires_at')
    .in('status', ['ready', 'building', 'failed']).lte('created_at', now.toISOString()).limit(500)
  if (error) { console.error('[impact/export] expiry read failed', error.message); out.errors++; return out }
  for (const r of (data ?? []) as ExportRow[]) {
    const act = exportAction(r, now)
    if (!act) continue
    if (opts.dry) { if (act === 'expire') out.expired++; else out.failed++; continue }
    if (act === 'fail') {
      const u = await db.from('impact_exports').update({ status: 'failed', error: 'Stopped: took too long' }).eq('id', r.id).eq('status', 'building')
      if (u.error) out.errors++; else out.failed++
      continue
    }
    if (r.path) {
      const rm = await db.storage.from(EXPORT_BUCKET).remove([r.path])
      if (rm.error) { console.error('[impact/export] delete failed', r.id, rm.error.message); out.errors++; continue }
    }
    const u = await db.from('impact_exports').update({ status: 'expired', path: null }).eq('id', r.id)
    if (u.error) out.errors++; else out.expired++
  }
  return out
}
