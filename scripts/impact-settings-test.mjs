// Impact Settings (brief 5), end to end against a running app: the audit log (written by
// the database on every settings save, readable only by the org, never editable), "Export
// everything" (HQ or admin only, the link only to the requester's own sign-in email, only
// their own org's rows, deleted after 7 days), logo upload, status, test email, the AI and
// text switches, and erase (off, or with ERASE=on its full checks). Two throwaway orgs with HQ, coach and parent
// logins; everything is deleted at the end. Touches no real org.
//
// Run against a local server started with:
//   IMPACT_EXPORTS_EMAIL=dry IMPACT_INVITES_LIVE=dry CRON_SECRET=local-comms-test IMPACT_COMMS_DRY=on
// then:  BASE=http://localhost:3077 node scripts/impact-settings-test.mjs

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { inflateRawSync } from 'node:zlib'

registerHooks({
  resolve(spec, ctx, next) {
    const base = spec.startsWith('./') && ctx.parentURL?.includes('/src/') ? fileURLToPath(new URL(spec, ctx.parentURL)) : null
    return base && existsSync(`${base}.ts`) ? next(pathToFileURL(`${base}.ts`).href, ctx) : next(spec, ctx)
  },
})
const { expireExports } = await import('../src/lib/impact/export-server.ts')

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '') }
} catch { /* ignore */ }

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '')
if (!SB || !KEY || !ANON) { console.error('Missing Supabase env'); process.exit(2) }
if (!/localhost|127\.0\.0\.1/.test(BASE)) { console.error('Run this against a local server only.'); process.exit(2) }

const admin = createClient(SB, KEY, { auth: { persistSession: false } })
const anon = createClient(SB, ANON, { auth: { persistSession: false } })
const tag = `settest-${Date.now()}`
let pass = 0, fail = 0
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗ FAIL:', name, detail) } }
const users = [], orgs = []

async function signIn(email) {
  const jar = new Map()
  const db = createServerClient(SB, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: all => all.forEach(c => jar.set(c.name, c.value)) } })
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error) throw error
  const { error: otpError } = await db.auth.verifyOtp({ email, token: link.properties.email_otp, type: 'email' })
  if (otpError) throw otpError
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
  const api = (path, init = {}) => fetch(`${BASE}${path}`, { redirect: 'manual', ...init, headers: { ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), cookie: cookie(), ...init.headers } })
  return { db, api }
}
async function user(letter) {
  const email = `${tag}_${letter}@lumio.test`
  const { data: { user: u }, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  users.push(u.id)
  return { id: u.id, email, ...(await signIn(email)) }
}
async function hq(letter) {
  const u = await user(letter)
  const slug = `${tag}-${letter}`
  await admin.from('sports_profiles').upsert({ id: u.id, sport: 'impact', display_name: slug, portal_slug: slug })
  const o = await admin.from('impact_orgs').insert({ slug, hq_id: u.id, settings: { org: `Org ${letter.toUpperCase()}` } })
  if (o.error) throw o.error
  orgs.push(u.id)
  return { ...u, slug }
}
const json = async r => r.json().catch(() => ({}))
const ERASE_ON = process.env.ERASE === 'on'   // set ERASE=on when the server runs with IMPACT_ERASE=on

function unzip(buf) {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const n = buf.readUInt16LE(end + 10), dirAt = buf.readUInt32LE(end + 16), out = {}
  for (let i = 0, p = dirAt; i < n; i++) {
    const size = buf.readUInt32LE(p + 20), nameLen = buf.readUInt16LE(p + 28), local = buf.readUInt32LE(p + 42)
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8')
    const at = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    out[name] = inflateRawSync(buf.subarray(at, at + size)).toString('utf8')
    p += 46 + nameLen
  }
  return out
}
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360f8cfc0f01f0005000201e2f6f2b50000000049454e44ae426082', 'hex')

async function main() {
  const A = await hq('a'), B = await hq('b')
  // A coach and a parent of org A.
  const { data: staff } = await admin.from('tp_staff').insert({ hq_id: A.id, name: 'Coach C', role: 'coach' }).select('id').single()
  const { data: famA } = await admin.from('tp_families').insert({ hq_id: A.id, guardian_name: `ExportFamA ${tag}`, email: `fam-a-${tag}@lumio.test`, phone: '07700 900123', consent_data: true, consent_at: new Date().toISOString(), opt_in_sms: true }).select('id').single()
  await admin.from('tp_families').insert({ hq_id: B.id, guardian_name: `SecretFamB ${tag}`, email: `fam-b-${tag}@lumio.test` })
  const C = await user('c'), P = await user('p')
  await admin.from('impact_members').insert([
    { user_id: C.id, hq_id: A.id, role: 'coach', staff_id: staff.id, accepted_at: new Date().toISOString() },
    { user_id: P.id, hq_id: A.id, role: 'parent', family_id: famA.id, accepted_at: new Date().toISOString() },
  ])
  await admin.from('impact_invites').insert({ hq_id: A.id, role: 'parent', family_id: famA.id, email: `inv-${tag}@lumio.test`, token_hash: `h-${tag}` })

  console.log('\nAudit log:')
  const before = (await admin.from('impact_settings_log').select('id').eq('hq_id', A.id)).data?.length ?? 0
  const { data: cur } = await A.db.from('impact_orgs').select('settings').eq('hq_id', A.id).single()
  const up = await A.db.from('impact_orgs').update({ settings: { ...cur.settings, org: 'Org A renamed', privacyUrl: 'https://example.org/p', modules: { social: false } } }).eq('hq_id', A.id).select('slug')
  ok('A saves its settings', !up.error && up.data?.length === 1, up.error?.message)
  const { data: rows } = await A.db.from('impact_settings_log').select('section, actor_id, source, diff').eq('hq_id', A.id).order('section')
  const auto = (rows ?? []).filter(r => r.source === 'auto')
  ok('the save is logged, one row per section', (rows?.length ?? 0) - before >= 2 && auto.map(r => r.section).join() === 'modules,organisation', JSON.stringify(auto.map(r => r.section)))
  ok('… as A, with old → new', auto.every(r => r.actor_id === A.id) && auto.find(r => r.section === 'organisation')?.diff?.org?.to === 'Org A renamed')
  ok('B reads none of A’s log', (await B.db.from('impact_settings_log').select('id').eq('hq_id', A.id)).data?.length === 0)
  ok('a coach of A reads none of it', (await C.db.from('impact_settings_log').select('id')).data?.length === 0)
  ok('a parent of A reads none of it', (await P.db.from('impact_settings_log').select('id')).data?.length === 0)
  ok('anon reads none of it', !!(await anon.from('impact_settings_log').select('id')).error || (await anon.from('impact_settings_log').select('id')).data?.length === 0)
  ok('B can’t write into A’s log', !!(await B.db.from('impact_settings_log').insert({ hq_id: A.id, section: 'booklet' })).error)
  ok('A logs an app save as itself', !(await A.db.from('impact_settings_log').insert({ hq_id: A.id, section: 'booklet', diff: { t: 1 } })).error)
  ok('A can’t name someone else', !!(await A.db.from('impact_settings_log').insert({ hq_id: A.id, section: 'booklet', actor_id: B.id })).error)
  ok('A can’t fake a database row', !!(await A.db.from('impact_settings_log').insert({ hq_id: A.id, section: 'organisation', source: 'auto' })).error)
  ok('A can’t write a data event', !!(await A.db.from('impact_settings_log').insert({ hq_id: A.id, section: 'data' })).error)
  ok('A can’t edit its log', !(await A.db.from('impact_settings_log').update({ section: 'other' }).eq('hq_id', A.id).select('id')).data?.length)
  ok('A can’t delete its log', !(await A.db.from('impact_settings_log').delete().eq('hq_id', A.id).select('id')).data?.length)
  ok('B’s org saw no rows from A’s save', (await admin.from('impact_settings_log').select('id').eq('hq_id', B.id)).data?.length === 0)

  console.log('\nExport everything: who may ask:')
  ok('anon is refused', (await fetch(`${BASE}/api/impact/settings/export`, { method: 'POST' })).status === 401)
  ok('a coach is refused', (await C.api('/api/impact/settings/export', { method: 'POST' })).status === 403)
  ok('a parent is refused', (await P.api('/api/impact/settings/export', { method: 'POST' })).status === 403)
  ok('B naming A’s org is refused', (await B.api('/api/impact/settings/export', { method: 'POST', headers: { 'x-impact-hq': A.id } })).status === 403)
  const ex = await A.api('/api/impact/settings/export', { method: 'POST', body: JSON.stringify({ email: 'attacker@evil.example', to: 'attacker@evil.example' }) })
  const exj = await json(ex)
  ok('A’s HQ makes one', ex.status === 200 && exj.id, JSON.stringify(exj))
  ok('… the link goes to A’s own sign-in email, not one in the request', exj.sentTo === `${A.email[0]}…@lumio.test` && !JSON.stringify(exj).includes('evil'), exj.sentTo)
  ok('… and a second straight away is refused', (await A.api('/api/impact/settings/export', { method: 'POST' })).status === 429)
  const row = (await admin.from('impact_exports').select('*').eq('id', exj.id).single()).data
  ok('the export row is ready, A’s, requested by A, 7 days', row?.status === 'ready' && row.hq_id === A.id && row.requested_by === A.id && Math.round((Date.parse(row.expires_at) - Date.parse(row.created_at)) / 86_400_000) === 7)
  ok('the export is logged (data, server, by A)', (await admin.from('impact_settings_log').select('actor_id, source').eq('hq_id', A.id).eq('section', 'data')).data?.some(r => r.actor_id === A.id && r.source === 'server'))
  ok('A’s HQ sees it in its history; B doesn’t', (await A.db.from('impact_exports').select('id')).data?.length === 1 && (await B.db.from('impact_exports').select('id').eq('hq_id', A.id)).data?.length === 0)

  console.log('\nExport everything: the link and the file:')
  const link = exj.link?.replace(/^https?:\/\/[^/]+/, '')
  ok('the link is the app’s, not the storage file', /^\/api\/impact\/settings\/export\/[0-9a-f-]{36}$/.test(link ?? ''), link)
  ok('signed out: asked to sign in', (await fetch(`${BASE}${link}`, { redirect: 'manual' })).status === 401)
  ok('B: not found', (await B.api(link)).status === 404)
  ok('A’s coach: not found', (await C.api(link)).status === 404)
  const dl = await A.api(link)
  ok('A: redirected to a short-lived file link', dl.status === 303 && /\/storage\/v1\/object\/sign\//.test(dl.headers.get('location') ?? ''))
  const zip = Buffer.from(await (await fetch(dl.headers.get('location'))).arrayBuffer())
  const files = unzip(zip)
  ok('the ZIP has a README and a CSV per table', files['README.txt'] && files['tp_families.csv'] && files['tp_children.csv'] && files['impact_settings_log.csv'])
  ok('… with A’s family', files['tp_families.csv']?.includes(`ExportFamA ${tag}`))
  ok('… and nothing of B’s', !Object.values(files).some(t => t.includes(`SecretFamB ${tag}`)))
  ok('… and no login tokens or invites', !files['impact_invites.csv'] && !files['impact_lead_hooks.csv'] && !Object.values(files).some(t => t.includes(`h-${tag}`)))

  console.log('\nExport everything: deleted after 7 days:')
  await admin.from('impact_exports').update({ expires_at: new Date(Date.now() - 60_000).toISOString() }).eq('id', exj.id)
  const dry = await expireExports(admin, new Date(), { dry: true })
  ok('a dry tidy counts it and changes nothing', dry.expired >= 1 && (await admin.from('impact_exports').select('status').eq('id', exj.id).single()).data?.status === 'ready')
  const cron = await fetch(`${BASE}/api/cron/impact-comms?dry=1`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.CRON_SECRET || 'local-comms-test'}` } })
  const cronj = await json(cron)
  ok('the scheduler’s dry run reports it', cron.status === 200 && cronj.dry === true && cronj.exports?.expired >= 1, JSON.stringify(cronj.exports))
  const real = await expireExports(admin, new Date())
  const after = (await admin.from('impact_exports').select('status, path').eq('id', exj.id).single()).data
  ok('the tidy expires it', real.expired >= 1 && after?.status === 'expired' && after.path === null, JSON.stringify(after))
  ok('… the ZIP is gone from the bucket', !!(await admin.storage.from('impact-exports').download(row.path)).error)
  ok('… and the link says it has expired', (await A.api(link)).status === 410)

  console.log('\nLogo:')
  const fd = () => { const f = new FormData(); f.append('file', new Blob([PNG], { type: 'image/png' }), 'logo.png'); return f }
  ok('a coach can’t upload one', (await C.api('/api/impact/settings/logo', { method: 'POST', body: fd() })).status === 403)
  const svg = new FormData(); svg.append('file', new Blob(['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'], { type: 'image/png' }), 'x.png')
  ok('an SVG dressed as a PNG is refused', (await A.api('/api/impact/settings/logo', { method: 'POST', body: svg })).status === 415)
  const lu = await A.api('/api/impact/settings/logo', { method: 'POST', body: fd() }), luj = await json(lu)
  ok('A uploads a PNG', lu.status === 200 && luj.logoPath?.startsWith(`${A.id}/`), JSON.stringify(luj))
  ok('… not served until it’s saved', (await fetch(`${BASE}/api/impact/logo/${A.slug}`)).status === 404)
  const { data: cur2 } = await A.db.from('impact_orgs').select('settings').eq('hq_id', A.id).single()
  await A.db.from('impact_orgs').update({ settings: { ...cur2.settings, logo: luj.logo, logoDark: luj.logo, logoPath: luj.logoPath } }).eq('hq_id', A.id)
  const lg = await fetch(`${BASE}/api/impact/logo/${A.slug}`)
  ok('saved: served as a PNG', lg.status === 200 && lg.headers.get('content-type') === 'image/png')
  ok('B has no logo', (await fetch(`${BASE}/api/impact/logo/${B.slug}`)).status === 404)
  // B points its own settings at A's file: still refused (path must be B's own).
  const { data: bs } = await B.db.from('impact_orgs').select('settings').eq('hq_id', B.id).single()
  await B.db.from('impact_orgs').update({ settings: { ...bs.settings, logoPath: luj.logoPath } }).eq('hq_id', B.id)
  ok('B can’t serve A’s file as its logo', (await fetch(`${BASE}/api/impact/logo/${B.slug}`)).status === 404)

  console.log('\nStatus, test email, switches:')
  const st = await A.api('/api/impact/settings/status'), stj = await json(st)
  ok('A reads its status', st.status === 200 && stj.email?.state && stj.sms?.state && stj.meta?.state && stj.replyTo === `reply+${A.slug}@inbound.lumiosports.com`)
  ok('… with no secrets in it', !/re_[A-Za-z0-9]{8}|sk-|AC[0-9a-f]{32}/.test(JSON.stringify(stj)))
  ok(`… and erase is ${ERASE_ON ? 'on' : 'off'}, as the server is set`, stj.erase === ERASE_ON)
  ok('a coach can’t read it', (await C.api('/api/impact/settings/status')).status === 403)
  const te = await A.api('/api/impact/settings/test-email', { method: 'POST', body: JSON.stringify({ to: 'attacker@evil.example' }) }), tej = await json(te)
  ok('test email goes to A’s own address only', te.status === 503 || (te.status === 200 && tej.sentTo === `${A.email[0]}…@lumio.test`), `${te.status} ${JSON.stringify(tej)}`)
  if (!ERASE_ON) {
    ok('erase is refused while switched off', (await A.api('/api/impact/settings/erase', { method: 'POST', body: JSON.stringify({ familyId: famA.id, confirm: 'ERASE' }) })).status === 503)
    ok('… and the family is untouched', (await admin.from('tp_families').select('guardian_name').eq('id', famA.id).single()).data?.guardian_name === `ExportFamA ${tag}`)
  }

  const { data: cur3 } = await A.db.from('impact_orgs').select('settings').eq('hq_id', A.id).single()
  await A.db.from('impact_orgs').update({ settings: { ...cur3.settings, ai: { off: { newsletter: true } }, messaging: { sms: false } } }).eq('hq_id', A.id)
  const ai = await A.api('/api/ai/impact', { method: 'POST', body: JSON.stringify({ feature: 'newsletter', prompt: 'x' }) }), aij = await json(ai)
  ok('AI newsletter drafts switched off: refused before any model call', (ai.status === 403 && /switched off in Settings/.test(aij.error ?? '')) || ai.status === 503, `${ai.status} ${aij.error}`)
  ok('… and nothing logged as spend', !(await admin.from('impact_ai_usage').select('id').eq('hq_id', A.id).gt('cost_pence', 0)).data?.length)
  const ms = await A.api('/api/impact/message/send', { method: 'POST', body: JSON.stringify({ recipients: [{ familyId: famA.id }], channels: ['sms'], body: 'Hello' }) })
  const msText = JSON.stringify(await json(ms))
  ok('texts switched off: no text sent, and it says why', /switched off in Settings/.test(msText) && !/"sent"/.test(msText.replace(/"sent":0/g, '')), `${ms.status} ${msText.slice(0, 200)}`)

  if (ERASE_ON) await eraseChecks(A, B, C, P, famA)
}

// Erase (IMPACT_ERASE=on, migration 241): HQ only; the family and children cleared but fee
// status, fee amount and stickers kept; unlinked emails from the family's addresses deleted
// (exact or +tag); the parent login deleted only when nothing else uses it.
async function eraseChecks(A, B, C, P, famA) {
  console.log('\nErase (switched on):')
  const famEmail = `fam-a-${tag}@lumio.test`, plus = famEmail.replace('@', '+news@')
  const { data: kid } = await admin.from('tp_children').insert({ hq_id: A.id, family_id: famA.id, name: `KidA ${tag}`, date_of_birth: '2016-05-01', class_name: 'Y4', gender: 'female', send: true, fsm: true, pupil_premium: true, medical_notes: 'asthma', notes: 'n', photo_consent: true, fee_status: 'paid', fee_pence: 4500, stickers: 3 }).select('id').single()
  // A second parent login on the same family who is also a member of org B: must be kept.
  const P2 = await user('p2')
  const { data: famB2 } = await admin.from('tp_families').insert({ hq_id: B.id, guardian_name: `KeepFamB ${tag}`, email: `fam-b2-${tag}@lumio.test` }).select('id').single()
  await admin.from('impact_members').insert([
    { user_id: P2.id, hq_id: A.id, role: 'parent', family_id: famA.id, accepted_at: new Date().toISOString() },
    { user_id: P2.id, hq_id: B.id, role: 'parent', family_id: famB2.id, accepted_at: new Date().toISOString() },
  ])
  const msg = (key, from, hq = A.id) => ({ hq_id: hq, thread_key: `email:${key}`, family_id: null, channel: 'email', direction: 'in', subject: 's', body: 'b', status: 'received', external_id: `x-${tag}-${Math.random()}`, from_address: from })
  await admin.from('impact_messages').insert([
    msg(famEmail, famEmail), msg(plus, plus), msg(famEmail.toUpperCase(), famEmail.toUpperCase()),
    msg(`someone-else-${tag}@lumio.test`, `someone-else-${tag}@lumio.test`),   // not theirs: kept
    msg(famEmail, famEmail, B.id),                                             // another org: kept
  ])
  const body = JSON.stringify({ familyId: famA.id, confirm: 'ERASE' })
  ok('a coach is refused', (await C.api('/api/impact/settings/erase', { method: 'POST', body })).status === 403)
  ok('a parent is refused', (await P.api('/api/impact/settings/erase', { method: 'POST', body })).status === 403)
  ok('B can’t erase A’s family', (await B.api('/api/impact/settings/erase', { method: 'POST', body })).status === 404)
  ok('B naming A’s org is refused', (await B.api('/api/impact/settings/erase', { method: 'POST', body, headers: { 'x-impact-hq': A.id } })).status === 403)
  ok('no ERASE typed: refused', (await A.api('/api/impact/settings/erase', { method: 'POST', body: JSON.stringify({ familyId: famA.id }) })).status === 400)
  ok('… and nothing changed yet', (await admin.from('tp_families').select('guardian_name').eq('id', famA.id).single()).data?.guardian_name === `ExportFamA ${tag}`)

  const r = await A.api('/api/impact/settings/erase', { method: 'POST', body }), rj = await json(r)
  ok('A’s HQ erases the family', r.status === 200 && rj.ok === true, `${r.status} ${JSON.stringify(rj)}`)
  ok('… 3 unlinked emails deleted (exact, +tag, capitals)', rj.unlinkedEmails === 3, JSON.stringify(rj))
  ok('… one login deleted, one kept (still in org B)', rj.loginsDeleted === 1 && rj.loginsKept === 1, JSON.stringify(rj))
  const { data: f } = await admin.from('tp_families').select('guardian_name, email, phone, erased_at').eq('id', famA.id).single()
  ok('family name, email and phone cleared', f.guardian_name === 'Erased family' && f.email === null && f.phone === null && !!f.erased_at)
  const { data: k } = await admin.from('tp_children').select('*').eq('id', kid.id).single()
  ok('child cleared, FSM and pupil premium included', k.name === 'Erased child' && k.date_of_birth === null && k.class_name === null && k.gender === null && k.send === null && k.fsm === null && k.pupil_premium === null && k.medical_notes === null && k.notes === null && k.photo_consent === false, JSON.stringify(k))
  ok('fee status, fee amount and stickers kept', k.fee_status === 'paid' && k.fee_pence === 4500 && k.stickers === 3, JSON.stringify({ s: k.fee_status, p: k.fee_pence, st: k.stickers }))
  const left = (await admin.from('impact_messages').select('hq_id, from_address').like('external_id', `x-${tag}-%`)).data ?? []
  ok('someone else’s email and org B’s are kept', left.length === 2 && left.some(m => m.hq_id === B.id) && left.some(m => m.from_address.startsWith('someone-else')), JSON.stringify(left))
  ok('the parent only in A: login deleted', !(await admin.auth.admin.getUserById(P.id)).data?.user)
  ok('the parent also in B: login kept, still a member of B', !!(await admin.auth.admin.getUserById(P2.id)).data?.user && (await admin.from('impact_members').select('revoked_at').eq('user_id', P2.id).eq('hq_id', B.id).single()).data?.revoked_at === null)
  ok('… but no longer of A', !!(await admin.from('impact_members').select('revoked_at').eq('user_id', P2.id).eq('hq_id', A.id).single()).data?.revoked_at)
  const logs = (await admin.from('impact_settings_log').select('diff, source, actor_id').eq('hq_id', A.id).eq('section', 'data')).data ?? []
  ok('logged: counts incl. unlinked emails, by A', logs.some(l => l.diff?.erasedFamily === famA.id && l.diff?.unlinkedEmails === 3 && l.actor_id === A.id))
  ok('logged: logins deleted and kept', logs.some(l => l.diff?.loginsDeleted === 1 && l.diff?.loginsKept === 1))
  ok('… and no names or emails in the log', !JSON.stringify(logs).includes(tag))
  ok('erasing again: already erased', (await json(await A.api('/api/impact/settings/erase', { method: 'POST', body }))).alreadyErased === true)
  ok('B’s families untouched', (await admin.from('tp_families').select('guardian_name').eq('hq_id', B.id)).data?.every(x => x.guardian_name !== 'Erased family'))
}

try { await main() }
catch (e) { fail++; console.log('  ✗ FAIL: the script stopped:', e?.message ?? e) }
finally {
  for (const h of orgs) {
    const { data: ex } = await admin.storage.from('impact-exports').list(h); if (ex?.length) await admin.storage.from('impact-exports').remove(ex.map(f => `${h}/${f.name}`))
    const { data: lo } = await admin.storage.from('impact-org-assets').list(h); if (lo?.length) await admin.storage.from('impact-org-assets').remove(lo.map(f => `${h}/${f.name}`))
    await admin.from('impact_orgs').delete().eq('hq_id', h)
    await admin.from('sports_profiles').delete().eq('id', h)
  }
  for (const u of users) await admin.auth.admin.deleteUser(u)
  const left = (await admin.from('impact_orgs').select('slug').like('slug', `${tag}%`)).data?.length ?? 0
  console.log(`\nCleaned up (${left} test orgs left).`)
  console.log(`${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}
