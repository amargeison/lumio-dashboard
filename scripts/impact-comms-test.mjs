// Communications (brief 4, migration 238), end to end against a running app and the real
// database, as two throwaway orgs deleted at the end. Touches no real org, sends no real
// email, and calls the scheduler only as a dry run.
//   Audiences and the reachable line; B can't count A's. Newsletters: what a browser may
//   and may not do to a campaign; "Send me a test"; "Send now" → per-recipient rows
//   (sent, or skipped with the reason). Resend webhooks: signature, de-duplication,
//   delivered → opened (never back), bounce marks the family's email (cleared when it
//   changes), complaint unsubscribes. The unsubscribe link counts against the newsletter.
//   Inbound replies thread by the sender's email only; another org's address, an unknown
//   sender and a Coach token all stay out of the family's thread. The parent's in-app
//   reply. Assigning a thread to a coach. Automations' preview, and what the browser
//   can't write. The AI allowance: refused over the cap, logged, readable only by its org.
//   Cross-org on every new table. The cron: refused without the secret; a dry run writes
//   nothing.
//
// The app under test must run with (never set on the server):
//   IMPACT_COMMS_DRY=on  RESEND_IMPACT_WEBHOOK_SECRET=<the same as here>  CRON_SECRET=<the same as here>
// Run:  BASE=http://localhost:3077 RESEND_IMPACT_WEBHOOK_SECRET=… CRON_SECRET=… node scripts/impact-comms-test.mjs

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '') }
} catch { /* ignore */ }
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '')
const HOOK = process.env.RESEND_IMPACT_WEBHOOK_SECRET, CRON = process.env.CRON_SECRET
if (!SB || !KEY || !ANON) { console.error('Missing Supabase env'); process.exit(2) }
if (!/localhost|127\.0\.0\.1/.test(BASE)) { console.error('Run against a local server started with IMPACT_COMMS_DRY=on.'); process.exit(2) }
if (!HOOK || !CRON) { console.error('Set RESEND_IMPACT_WEBHOOK_SECRET and CRON_SECRET to the values the local server was started with.'); process.exit(2) }

const admin = createClient(SB, KEY, { auth: { persistSession: false } })
const tag = `commstest-${Date.now()}`
let pass = 0, fail = 0
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗ FAIL:', name, detail) } }
const made = []
const rows = async (hqId, table, f = q => q) => (await f(admin.from(table).select('*').eq('hq_id', hqId))).data ?? []

async function login(email) {
  const jar = new Map()
  const db = createServerClient(SB, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: all => all.forEach(c => jar.set(c.name, c.value)) } })
  const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const { error } = await db.auth.verifyOtp({ email, token: link.properties.email_otp, type: 'email' })
  if (error) throw error
  return { db, cookie: () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ') }
}
async function user(email) {
  const { data: { user: u }, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  made.push(u.id)
  return u
}
async function hq(letter) {
  const email = `${tag}_${letter}@lumio.test`
  const u = await user(email)
  const slug = `${tag}-${letter}`
  await admin.from('sports_profiles').upsert({ id: u.id, sport: 'impact', display_name: slug, portal_slug: slug })
  const org = await admin.from('impact_orgs').insert({ slug, hq_id: u.id, settings: { org: `Org ${letter.toUpperCase()}`, address: '1 Test Street', town: 'Brackenmoor' } })
  if (org.error) throw org.error
  const s = await login(email)
  const call = async (path, body, as = u.id) => {
    const res = await fetch(`${BASE}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', cookie: s.cookie(), 'x-impact-hq': as }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: res.status, body: await res.json().catch(() => ({})) }
  }
  return { id: u.id, email, slug, db: s.db, call }
}

let svixN = 0
async function hook(payload, { sign = true, id = `msg_${tag}_${++svixN}` } = {}) {
  const raw = JSON.stringify(payload)
  const ts = Math.floor(Date.now() / 1000)
  const key = Buffer.from(HOOK.replace(/^whsec_/, ''), 'base64')
  const sig = sign ? `v1,${createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest('base64')}` : 'v1,bad'
  const res = await fetch(`${BASE}/api/impact/webhooks/resend`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'svix-id': id, 'svix-timestamp': String(ts), 'svix-signature': sig }, body: raw })
  return { status: res.status, body: await res.json().catch(() => ({})) }
}
const unsubToken = familyId => `${familyId.toLowerCase()}.${createHmac('sha256', KEY).update(`impact-unsubscribe:${familyId.toLowerCase()}`).digest('base64url')}`

async function main() {
  const A = await hq('a'), B = await hq('b')
  const fam = async (x) => (await admin.from('tp_families').insert({ hq_id: A.id, consent_data: true, opt_in_email: true, opt_in_sms: false, opt_in_app: true, ...x }).select('id, email').single()).data
  const school = (await admin.from('tp_schools').insert({ hq_id: A.id, name: 'Brackenmoor Primary', status: 'confirmed' }).select('id').single()).data.id
  const f1 = await fam({ guardian_name: 'Ada Reachable', email: `ada+${tag}@example.com` })
  const f2 = await fam({ guardian_name: 'Ben NoConsent', email: `ben+${tag}@example.com`, consent_data: null })
  const f3 = await fam({ guardian_name: 'Cat Unsubscribed', email: `cat+${tag}@example.com`, unsubscribed_at: new Date().toISOString() })
  const f4 = await fam({ guardian_name: 'Dan NoEmail', email: null })
  const f5 = await fam({ guardian_name: 'Eve Bounced', email: `eve+${tag}@example.com`, email_bounced_at: new Date().toISOString() })
  await admin.from('tp_children').insert([{ hq_id: A.id, family_id: f1.id, name: 'Kid One', school_id: school }, { hq_id: A.id, family_id: f2.id, name: 'Kid Two', school_id: school }])

  console.log('\nAudiences:')
  const all = await A.call('/api/impact/comms/audience', { audience: { kind: 'all' } })
  ok('all families: “1 of 5 reachable — 1 has no consent, 1 unsubscribed, 1 no email, 1 needs a new email”', all.body.line === '1 of 5 reachable — 1 has no consent, 1 unsubscribed, 1 no email, 1 needs a new email', JSON.stringify(all.body.line))
  ok('… names only, never addresses', all.body.people?.length === 5 && !JSON.stringify(all.body).includes('@example.com'))
  const bySchool = await A.call('/api/impact/comms/audience', { audience: { kind: 'school', id: school } })
  ok('by school: the two families with a child there', bySchool.body.total === 2 && bySchool.body.reachable === 1)
  const list = await A.call('/api/impact/comms/audience', { all: true })
  ok('every audience, each school listed', list.status === 200 && list.body.audiences.some(a => a.audience.kind === 'school' && a.audience.id === school) && list.body.audiences.some(a => a.audience.kind === 'lapsed'))
  ok('B can’t count A’s families', (await B.call('/api/impact/comms/audience', { audience: { kind: 'all' } }, A.id)).status === 403)

  console.log('\nNewsletters — what the browser may do:')
  const sections = [{ headline: 'This weekend', body: 'Come and play.\n\nBring a friend.', image: null, button: { label: 'See times', url: 'https://example.com/times' } }]
  const draft = await A.db.from('impact_campaigns').insert({ hq_id: A.id, kind: 'newsletter', name: 'News', subject: 'Weekend news', preheader: 'What’s on', sections, audience: { kind: 'all', id: null }, channels: ['email'], status: 'draft' }).select('id').single()
  ok('HQ saves a draft', !draft.error && !!draft.data?.id, draft.error?.message)
  const cid = draft.data.id
  ok('… can’t create one already sent', !!(await A.db.from('impact_campaigns').insert({ hq_id: A.id, name: 'x', status: 'sent' })).error)
  ok('… can’t mark it sending', !!(await A.db.from('impact_campaigns').update({ status: 'sending' }).eq('id', cid)).error)
  ok('… can’t write the counts', !!(await A.db.from('impact_campaigns').update({ counts: { sent: 999 } }).eq('id', cid)).error)
  ok('… can’t schedule it in the past', !!(await A.db.from('impact_campaigns').update({ status: 'scheduled', scheduled_at: '2020-01-01T00:00:00Z' }).eq('id', cid)).error)
  ok('… can’t write recipient rows', !!(await A.db.from('impact_campaign_recipients').insert({ hq_id: A.id, campaign_id: cid, family_id: f1.id, channel: 'email', status: 'opened' })).error)
  ok('B can’t read A’s newsletter', ((await B.db.from('impact_campaigns').select('id').eq('id', cid)).data ?? []).length === 0)
  ok('B can’t send A’s newsletter', (await B.call('/api/impact/comms/campaign', { action: 'send', id: cid }, A.id)).status === 403 && (await B.call('/api/impact/comms/campaign', { action: 'send', id: cid })).status === 404)

  const t = await A.call('/api/impact/comms/campaign', { action: 'test', id: cid })
  ok('“Send me a test” goes to the HQ’s own address only', t.status === 200 && t.body.to === A.email, JSON.stringify(t.body))
  ok('… and records nothing against families', (await rows(A.id, 'impact_campaign_recipients')).length === 0)

  const sent = await A.call('/api/impact/comms/campaign', { action: 'send', id: cid })
  ok('“Send now”: one sent, four skipped', sent.status === 200 && sent.body.sent === 1 && sent.body.done === true, JSON.stringify(sent.body))
  const rec = await rows(A.id, 'impact_campaign_recipients', q => q.eq('campaign_id', cid))
  const by = id => rec.find(r => r.family_id === id)
  ok('per-recipient rows with the reason', rec.length === 5 && by(f1.id)?.status === 'sent' && /^dry_/.test(by(f1.id)?.provider_id ?? '') && by(f2.id)?.skip_reason === 'no consent' && by(f3.id)?.skip_reason === 'unsubscribed' && by(f4.id)?.skip_reason === 'no email' && by(f5.id)?.skip_reason === 'email bounced', JSON.stringify(rec.map(r => [r.status, r.skip_reason])))
  const [camp] = await rows(A.id, 'impact_campaigns', q => q.eq('id', cid))
  ok('the campaign is sent, with counts', camp.status === 'sent' && camp.counts?.sent === 1 && camp.counts?.skipped === 4 && !!camp.sent_at)
  ok('sending twice is refused', (await A.call('/api/impact/comms/campaign', { action: 'send', id: cid })).status === 409)
  ok('a sent newsletter can’t be edited or deleted', !!(await A.db.from('impact_campaigns').update({ subject: 'changed' }).eq('id', cid)).error && ((await A.db.from('impact_campaigns').delete().eq('id', cid).select('id')).data ?? []).length === 0)
  ok('B can’t read A’s recipients', ((await B.db.from('impact_campaign_recipients').select('id').eq('campaign_id', cid)).data ?? []).length === 0)

  console.log('\nResend webhooks:')
  const pid = by(f1.id).provider_id
  ok('a bad signature is refused', (await hook({ type: 'email.delivered', data: { email_id: pid } }, { sign: false })).status === 401)
  await hook({ type: 'email.delivered', created_at: new Date().toISOString(), data: { email_id: pid, to: [f1.email] } })
  ok('delivered', (await rows(A.id, 'impact_campaign_recipients', q => q.eq('id', by(f1.id).id)))[0]?.status === 'delivered')
  await hook({ type: 'email.opened', data: { email_id: pid } }, { id: 'msg_open_once_' + tag })
  ok('opened', (await rows(A.id, 'impact_campaign_recipients', q => q.eq('id', by(f1.id).id)))[0]?.status === 'opened')
  ok('the same event again is a repeat', (await hook({ type: 'email.opened', data: { email_id: pid } }, { id: 'msg_open_once_' + tag })).body.dedup === true)
  await hook({ type: 'email.delivered', data: { email_id: pid } })
  ok('a late “delivered” doesn’t undo “opened”', (await rows(A.id, 'impact_campaign_recipients', q => q.eq('id', by(f1.id).id)))[0]?.status === 'opened')
  ok('another product’s email is ignored', (await hook({ type: 'email.delivered', data: { email_id: 'someone-elses-id' } })).body.ignored === 'not an Impact email')

  // The unsubscribe link counts against the newsletter it came in.
  const un = await fetch(`${BASE}/api/impact/unsubscribe?t=${encodeURIComponent(unsubToken(f1.id))}`, { method: 'POST' })
  ok('unsubscribing from the email: family unsubscribed, the newsletter counts it', un.status === 200 && !!(await rows(A.id, 'tp_families', q => q.eq('id', f1.id)))[0]?.unsubscribed_at && (await rows(A.id, 'impact_campaign_recipients', q => q.eq('id', by(f1.id).id)))[0]?.status === 'unsubscribed')
  await admin.from('tp_families').update({ unsubscribed_at: null }).eq('id', f1.id)

  // A bounce on a second newsletter.
  const c2 = (await A.db.from('impact_campaigns').insert({ hq_id: A.id, kind: 'newsletter', name: 'Two', subject: 'Second', sections, audience: { kind: 'school', id: school }, channels: ['email'], status: 'draft' }).select('id').single()).data.id
  await A.call('/api/impact/comms/campaign', { action: 'send', id: c2 })
  const r2 = (await rows(A.id, 'impact_campaign_recipients', q => q.eq('campaign_id', c2).eq('family_id', f1.id)))[0]
  await hook({ type: 'email.bounced', data: { email_id: r2.provider_id, to: [f1.email], bounce: { type: 'Permanent', message: 'Mailbox does not exist' } } })
  const bounced = (await rows(A.id, 'tp_families', q => q.eq('id', f1.id)))[0]
  ok('a bounce: recipient bounced, family “needs a new email”', (await rows(A.id, 'impact_campaign_recipients', q => q.eq('id', r2.id)))[0]?.status === 'bounced' && !!bounced.email_bounced_at && /Mailbox does not exist/.test(bounced.email_bounce_reason))
  ok('… the next audience leaves them out', (await A.call('/api/impact/comms/audience', { audience: { kind: 'all' } })).body.reachable === 0)
  await A.db.from('tp_families').update({ email: `ada.new+${tag}@example.com` }).eq('id', f1.id)
  ok('… changing the email clears it', !(await rows(A.id, 'tp_families', q => q.eq('id', f1.id)))[0]?.email_bounced_at)
  f1.email = `ada.new+${tag}@example.com`

  console.log('\nInbound replies:')
  const inbound = (to, from, extra = {}) => hook({ type: 'email.received', data: { email_id: `in_${++svixN}`, message_id: `<m${svixN}@${tag}>`, to: [to], from, subject: 'Re: Weekend news', text: 'Yes, we’ll be there!\n\nOn Thu, 26 Nov 2026, Org A <x@y> wrote:\n> Come and play.', ...extra } })
  const r1 = await inbound(`reply+${A.slug}@inbound.lumiosports.com`, `Ada <${f1.email.toUpperCase()}>`, { message_id: `<dup@${tag}>` })
  const msgs = await rows(A.id, 'impact_messages', q => q.eq('direction', 'in'))
  ok('a reply from a family’s address threads into that family', r1.body.known === true && msgs.length === 1 && msgs[0].thread_key === `family:${f1.id}` && msgs[0].body === 'Yes, we’ll be there!' && msgs[0].channel === 'email' && !msgs[0].read_at, JSON.stringify(r1.body))
  ok('… with a thread row', (await rows(A.id, 'impact_threads', q => q.eq('thread_key', `family:${f1.id}`))).length === 1)
  ok('the same email delivered twice is filed once', (await inbound(`reply+${A.slug}@inbound.lumiosports.com`, f1.email, { message_id: `<dup@${tag}>` })).body.dedup === true && (await rows(A.id, 'impact_messages', q => q.eq('direction', 'in'))).length === 1)
  await inbound(`reply+${A.slug}@inbound.lumiosports.com`, `stranger+${tag}@example.com`)
  const stranger = (await rows(A.id, 'impact_messages', q => q.eq('direction', 'in').is('family_id', null)))[0]
  ok('an unknown sender is filed on its own, matched to nobody', stranger?.thread_key === `email:stranger+${tag}@example.com`)
  await inbound(`reply+${B.slug}@inbound.lumiosports.com`, f1.email)
  ok('A’s family writing to B’s address lands in B, as an unknown sender', (await rows(B.id, 'impact_messages')).length === 1 && (await rows(B.id, 'impact_messages'))[0].family_id === null && (await rows(A.id, 'impact_messages', q => q.eq('direction', 'in'))).length === 2)
  ok('a Coach reply token is ignored here', (await inbound('reply+AQIDBAUGBwgJCgsMDQ4PEA.abcdefabcdef@inbound.lumiosports.com', f1.email)).body.ignored === 'not an Impact reply address')
  ok('B can’t read A’s inbox', ((await B.db.from('impact_messages').select('id').eq('hq_id', A.id)).data ?? []).length === 0)

  console.log('\nThe family app and coaches:')
  const pEmail = `${tag}_parent@lumio.test`
  const pu = await user(pEmail)
  await admin.from('impact_members').insert({ user_id: pu.id, hq_id: A.id, role: 'parent', family_id: f1.id, invited_email: pEmail, accepted_at: new Date().toISOString() })
  const P = await login(pEmail)
  const pr = await P.db.rpc('impact_parent_reply', { p_family: f1.id, p_body: 'Can we bring a friend?' })
  ok('the parent replies from the app: into the same thread', !pr.error && (await rows(A.id, 'impact_messages', q => q.eq('id', pr.data)))[0]?.thread_key === `family:${f1.id}`, pr.error?.message)
  ok('… not for another family', !!(await P.db.rpc('impact_parent_reply', { p_family: f2.id, p_body: 'hi' })).error)
  const pRead = (await P.db.from('impact_messages').select('direction, body').eq('family_id', f1.id)).data ?? []
  ok('… and sees both sides of their own conversation, nobody else’s', pRead.some(m => m.direction === 'in') && ((await P.db.from('impact_messages').select('id').eq('hq_id', B.id)).data ?? []).length === 0)

  const coachA = (await admin.from('tp_staff').insert({ hq_id: A.id, name: 'Coach Ana' }).select('id').single()).data.id
  const coachB = (await admin.from('tp_staff').insert({ hq_id: B.id, name: 'Coach Bo' }).select('id').single()).data.id
  ok('HQ assigns the thread to its coach', !(await A.db.from('impact_threads').upsert({ hq_id: A.id, thread_key: `family:${f1.id}`, family_id: f1.id, assigned_staff_id: coachA }, { onConflict: 'hq_id,thread_key' })).error)
  ok('… not to another org’s coach', !!(await A.db.from('impact_threads').upsert({ hq_id: A.id, thread_key: `family:${f1.id}`, family_id: f1.id, assigned_staff_id: coachB }, { onConflict: 'hq_id,thread_key' })).error)
  ok('HQ marks replies read', ((await A.db.from('impact_messages').update({ read_at: new Date().toISOString() }).eq('hq_id', A.id).eq('thread_key', `family:${f1.id}`).eq('direction', 'in').select('id')).data ?? []).length === 2)

  console.log('\nAutomations:')
  ok('HQ switches one on', !(await A.db.from('impact_automations').upsert({ hq_id: A.id, kind: 'welcome', enabled: true, config: { since: new Date(Date.now() - 86_400_000).toISOString() } }, { onConflict: 'hq_id,kind' })).error)
  const pv = await A.call('/api/impact/comms/automations', { kind: 'welcome' })
  ok('“Who would get it today”: the new families who can be reached, the rest left out with why', pv.status === 200 && pv.body.send.some(s => s.name === 'Ada Reachable') && pv.body.skipped.some(s => s.name === 'Ben NoConsent' && s.reason === 'no consent') && !JSON.stringify(pv.body).includes('@example.com'), JSON.stringify(pv.body).slice(0, 300))
  ok('the browser can’t record a send', !!(await A.db.from('impact_automation_sends').insert({ hq_id: A.id, automation_id: (await rows(A.id, 'impact_automations'))[0].id, family_id: f1.id, step: 'instant', send_date: '2026-11-26', status: 'sent' })).error)
  ok('B can’t read A’s automations or preview them', ((await B.db.from('impact_automations').select('id').eq('hq_id', A.id)).data ?? []).length === 0 && (await B.call('/api/impact/comms/automations', { kind: 'welcome' }, A.id)).status === 403)

  console.log('\nAI allowance:')
  await admin.from('impact_ai_usage').insert({ hq_id: A.id, feature: 'newsletter', model: 'claude-sonnet-4-6', input_tokens: 1, output_tokens: 1, cost_pence: 200 })
  const capped = await A.call('/api/ai/impact', { feature: 'newsletter', angle: 'this_week' })
  ok('over £2 today: a friendly refusal, the model is not called', capped.status === 429 && /today’s AI allowance/.test(capped.body.error), JSON.stringify(capped.body))
  ok('… and the refusal is logged', (await rows(A.id, 'impact_ai_usage', q => q.eq('refused', true))).length === 1)
  const usage = await A.call('/api/ai/impact')
  ok('Settings shows today’s use against the cap', usage.body.spentPence === 200 && usage.body.capPence === 200, JSON.stringify(usage.body))
  ok('signed out: refused', (await fetch(`${BASE}/api/ai/impact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"feature":"message","messages":[{"role":"user","content":"hi"}]}' })).status === 401)
  ok('B can’t read A’s usage, A can’t write its own', ((await B.db.from('impact_ai_usage').select('id').eq('hq_id', A.id)).data ?? []).length === 0 && !!(await A.db.from('impact_ai_usage').insert({ hq_id: A.id, feature: 'x', model: 'x' })).error)
  ok('the importer is held to the same allowance', (await A.call('/api/impact/import/map', { fileName: 'x.xlsx', sheets: [{ name: 'Sheet1', sample: 'a,b' }] })).status === 429)

  console.log('\nScheduler:')
  ok('refused without the secret', (await fetch(`${BASE}/api/cron/impact-comms?dry=1`, { method: 'POST' })).status === 401)
  const before = (await admin.from('impact_scheduler_runs').select('id', { count: 'exact', head: true })).count
  const dry = await fetch(`${BASE}/api/cron/impact-comms?dry=1`, { method: 'POST', headers: { Authorization: `Bearer ${CRON}` } })
  const dj = await dry.json()
  ok('a dry run reports per org and writes nothing', dry.status === 200 && dj.dry === true && Array.isArray(dj.orgs) && (await admin.from('impact_scheduler_runs').select('id', { count: 'exact', head: true })).count === before && !(await admin.from('impact_scheduler_leases').select('job').eq('job', 'impact-comms')).data?.length, JSON.stringify(dj).slice(0, 300))
  const mine = dj.orgs.find(o => o.org === A.slug)
  ok('… A’s welcome would go to its one reachable new family', mine?.automations?.wouldSend?.welcome === 1, JSON.stringify(mine))
  ok('… and the report has no names or addresses', !/@|Ada|Reachable/.test(JSON.stringify(dj)))
}

try { await main() } catch (e) { fail++; console.error('  ✗ FAIL: stopped early:', e.stack ?? e) }
finally {
  for (const id of made) {
    await admin.from('impact_members').delete().eq('user_id', id)
    await admin.from('impact_orgs').delete().eq('hq_id', id)
    await admin.from('sports_profiles').delete().eq('id', id)
    await admin.auth.admin.deleteUser(id)
  }
  await admin.from('impact_provider_events').delete().like('id', `resend:msg_%${tag}%`)
  const left = await admin.from('impact_orgs').select('slug').like('slug', `${tag}%`)
  console.log(`\n${pass} passed, ${fail} failed. Throwaway orgs left: ${left.data?.length ?? 'unknown'}`)
}
process.exit(fail ? 1 : 0)
