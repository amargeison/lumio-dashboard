// Community (brief 3, migration 237), end to end against a running app and the real
// database, as two throwaway orgs that are deleted at the end. Touches no real org.
//   /join: closed until a privacy link is set (server-side), never shows existing data,
//   writes family + children + audit row, one identical reply for new and known
//   addresses (a known one creates nothing), the
//   waiting list, the venue poster's QR channel, honeypot and speed checks, rate limit,
//   module off, the demo writes nothing.
//   Check-in, the day's numbers, parent intents, and cross-org on every new table.
//   An import's Community rows are stamped and undone with it.
//
// Run:  BASE=http://localhost:3077 node scripts/impact-community-test.mjs
// Each scenario sends its own X-Forwarded-For so the per-address limit only trips where
// it is being tested (locally there is no proxy; in production nginx sets the address).

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync } from 'node:fs'

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '') }
} catch { /* ignore */ }
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '')
if (!SB || !KEY || !ANON) { console.error('Missing Supabase env'); process.exit(2) }
if (!/localhost|127\.0\.0\.1/.test(BASE)) { console.error('Run against a local server: it sends many sign-ups and sets client addresses.'); process.exit(2) }

const admin = createClient(SB, KEY, { auth: { persistSession: false } })
const tag = `commtest-${Date.now()}`
let pass = 0, fail = 0
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗ FAIL:', name, detail) } }
const made = []
let ipN = 0
const nextIp = () => `203.0.113.${++ipN}`   // TEST-NET-3, never a real address

async function login(email) {
  const jar = new Map()
  const db = createServerClient(SB, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: all => all.forEach(c => jar.set(c.name, c.value)) } })
  const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const { error } = await db.auth.verifyOtp({ email, token: link.properties.email_otp, type: 'email' })
  if (error) throw error
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
  return { db, cookie }
}
async function hq(letter, settings = {}) {
  const email = `${tag}_${letter}@lumio.test`
  const { data: { user }, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  made.push(user.id)
  const slug = `${tag}-${letter}`
  await admin.from('sports_profiles').upsert({ id: user.id, sport: 'impact', display_name: slug, portal_slug: slug })
  const org = await admin.from('impact_orgs').insert({ slug, hq_id: user.id, settings: { org: `Org ${letter.toUpperCase()}`, ...settings } })
  if (org.error) throw org.error
  const s = await login(email)
  const call = async (path, body) => {
    const res = await fetch(`${BASE}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', cookie: s.cookie(), 'x-impact-hq': user.id }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: res.status, body: await res.json().catch(() => ({})) }
  }
  return { id: user.id, slug, db: s.db, call }
}
const join = async (slug, body, ip = nextIp()) => {
  const t0 = Date.now()
  const res = await fetch(`${BASE}/api/impact/join/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body) })
  return { status: res.status, body: await res.json().catch(() => ({})), ms: Date.now() - t0 }
}
const rows = async (hqId, table, f = q => q) => (await f(admin.from(table).select('*').eq('hq_id', hqId))).data ?? []
const form = (venueId, extra = {}) => ({ guardian: 'Chris Doyle', email: `chris.doyle+${tag}@example.com`, phone: '07700 900350', children: [{ name: 'Ben Doyle', dob: '2017-05-02' }, { name: 'Amy Doyle', dob: '2019-08-14' }],
  venueId, consentData: true, consentPhoto: false, optInEmail: true, optInSms: false, website: '', startedAt: Date.now() - 30_000, ...extra })

async function main() {
  const A = await hq('a'), B = await hq('b', { privacyUrl: 'https://org-b.example/privacy' })
  const small = (await admin.from('tp_venues').insert({ hq_id: A.id, name: 'Kingsmead Rec Ground', session_day: 'Saturday', session_time: '10:00', capacity: 1 }).select('id').single()).data.id
  const big = (await admin.from('tp_venues').insert({ hq_id: A.id, name: 'Brackenmoor Park Courts', session_day: 'Sunday', session_time: '10:30' }).select('id').single()).data.id
  const bVenue = (await admin.from('tp_venues').insert({ hq_id: B.id, name: 'B Park' }).select('id').single()).data.id
  // Something private in A, to prove the page and the replies never show it.
  await admin.from('tp_families').insert({ hq_id: A.id, guardian_name: 'Secret Existing', email: `secret+${tag}@example.com` })

  console.log('\n/join — closed until there is a privacy policy:')
  const closedPage = await (await fetch(`${BASE}/impact/${A.slug}/join`)).text()
  ok('the page says it opens soon', /Sign-up opens soon/.test(closedPage))
  ok('posting is refused server-side', (await join(A.slug, form(big))).status === 403)
  ok('… and wrote nothing', (await rows(A.id, 'tp_families')).length === 1)
  await admin.from('impact_orgs').update({ settings: { org: 'Org A', privacyUrl: 'http://not-https.example/privacy' } }).eq('hq_id', A.id)
  ok('an http privacy link doesn’t open it', (await join(A.slug, form(big))).status === 403)
  await admin.from('impact_orgs').update({ settings: { org: 'Org A', privacyUrl: 'https://org-a.example/privacy' } }).eq('hq_id', A.id)

  console.log('\n/join — open:')
  const page = await (await fetch(`${BASE}/impact/${A.slug}/join?venue=${small}&src=qr`)).text()
  ok('the page shows the org’s venues and privacy link', page.includes('Kingsmead Rec Ground') && page.includes('Brackenmoor Park Courts') && page.includes('https://org-a.example/privacy'))
  ok('… and nothing about anyone', !page.includes('Secret Existing') && !page.includes('secret+'))
  ok('… not another org’s venues', !page.includes('B Park'))
  ok('an unknown org is a 404', (await fetch(`${BASE}/impact/${tag}-nobody/join`)).status === 404 && (await join(`${tag}-nobody`, form(big))).status === 404)

  const first = await join(A.slug, form(small, { channel: 'qr' }))
  const SAME = JSON.stringify({ ok: true })
  ok('a family joins: the reply is only { ok: true }', first.status === 200 && JSON.stringify(first.body) === SAME, JSON.stringify(first.body))
  const [fam] = await rows(A.id, 'tp_families', q => q.eq('email', `chris.doyle+${tag}@example.com`))
  ok('family: community, venue, consents, signed up, a check-in code', fam?.source === 'community' && fam.community_venue_id === small && fam.consent_data === true && fam.consent_photo === false && !!fam.consent_at && !!fam.signed_up_at && !fam.waitlisted_at && /^[A-HJ-NP-Z2-9]{12}$/.test(fam.checkin_code) && fam.opt_in_email === true && fam.opt_in_sms === false, JSON.stringify(fam))
  const kids = await rows(A.id, 'tp_children', q => q.eq('family_id', fam.id))
  ok('children: two, with dates of birth, no school', kids.length === 2 && kids.every(k => k.school_id === null && k.programme_id === null && k.date_of_birth) && kids.every(k => k.photo_consent === false))
  const [audit] = await rows(A.id, 'tp_community_signups', q => q.eq('family_id', fam.id))
  ok('audit row: from the venue poster (qr), consent version, hashed address', audit?.channel === 'qr' && audit.venue_id === small && audit.consent_text_version === 'join-2026-11' && /^[0-9a-f]{64}$/.test(audit.ip_hash) && !JSON.stringify(audit).includes('203.0.113'), JSON.stringify(audit))

  const again = await join(A.slug, form(big, { guardian: 'Someone Else', email: `CHRIS.DOYLE+${tag}@example.com` }))
  ok('the same email again: the identical reply — nothing says it was known', again.status === 200 && JSON.stringify(again.body) === SAME, JSON.stringify(again.body))
  ok('… creates no family, child or sign-up', (await rows(A.id, 'tp_families')).length === 2 && (await rows(A.id, 'tp_children')).length === 2 && (await rows(A.id, 'tp_community_signups')).length === 1)
  const secret = await join(A.slug, form(big, { email: `secret+${tag}@example.com` }))
  ok('… the same for an HQ-added family', secret.status === 200 && JSON.stringify(secret.body) === SAME)
  ok('every accepted reply takes at least the 900 ms floor (new and known alike)', [first, again, secret].every(r => r.ms >= 880), [first, again, secret].map(r => r.ms).join(' / '))

  const full = await join(A.slug, form(small, { guardian: 'Grace Whitlow', email: `grace+${tag}@example.com`, children: [{ name: 'Lily Whitlow', dob: '2018-03-03' }] }))
  ok('venue at capacity: the identical reply (the waiting list is in the email)', full.status === 200 && JSON.stringify(full.body) === SAME)
  const [grace] = await rows(A.id, 'tp_families', q => q.eq('email', `grace+${tag}@example.com`))
  ok('… waitlisted, with the venue they chose, channel form', !!grace?.waitlisted_at && grace.community_venue_id === small && (await rows(A.id, 'tp_community_signups', q => q.eq('family_id', grace.id)))[0]?.channel === 'form')

  console.log('\n/join — refusals:')
  const before = (await rows(A.id, 'tp_families')).length
  ok('the hidden field filled: the identical reply, nothing saved', JSON.stringify((await join(A.slug, form(big, { email: `bot1+${tag}@example.com`, website: 'http://spam.example' }))).body) === SAME && (await rows(A.id, 'tp_families')).length === before)
  ok('sent within 3 seconds: the same', JSON.stringify((await join(A.slug, form(big, { email: `bot2+${tag}@example.com`, startedAt: Date.now() }))).body) === SAME && (await rows(A.id, 'tp_families')).length === before)
  const noConsent = await join(A.slug, form(big, { email: `nc+${tag}@example.com`, consentData: false }))
  ok('no data consent: refused in plain words, nothing saved', noConsent.status === 400 && noConsent.body.field === 'consentData' && (await rows(A.id, 'tp_families')).length === before)
  ok('another org’s venue: refused', (await join(A.slug, form(bVenue, { email: `x+${tag}@example.com` }))).body.field === 'venueId')
  ok('a bad date of birth: refused, naming the child', /Ben Doyle/.test((await join(A.slug, form(big, { email: `d+${tag}@example.com`, children: [{ name: 'Ben Doyle', dob: '2030-01-01' }] }))).body.error ?? ''))
  const ip = nextIp()
  const burst = []
  for (let i = 0; i < 6; i++) burst.push((await join(A.slug, form(big, { email: `burst${i}+${tag}@example.com`, consentData: false }), ip)).status)
  ok('six sign-ups from one address in ten minutes: the sixth is refused', burst.slice(0, 5).every(s => s === 400) && burst[5] === 429, burst.join())
  await admin.from('impact_orgs').update({ settings: { org: 'Org A', privacyUrl: 'https://org-a.example/privacy', modules: { community: false } } }).eq('hq_id', A.id)
  ok('Community switched off: closed', (await join(A.slug, form(big, { email: `off+${tag}@example.com` }))).status === 403)
  await admin.from('impact_orgs').update({ settings: { org: 'Org A', privacyUrl: 'https://org-a.example/privacy' } }).eq('hq_id', A.id)
  const demoBefore = (await admin.from('tp_community_signups').select('id', { count: 'exact', head: true })).count
  ok('the demo: a mock that writes nothing', (await join('demo', form('northvale'))).body.demo === true && (await admin.from('tp_community_signups').select('id', { count: 'exact', head: true })).count === demoBefore)
  ok('the demo page renders its own venues', (await (await fetch(`${BASE}/impact/demo/join`)).text()).includes('Northvale Rec Ground'))

  console.log('\nCheck-in, numbers, parent:')
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
  const ci = await A.db.rpc('impact_family_checkin', { p_hq: A.id, p_venue: small, p_code: fam.checkin_code })
  ok('HQ scans the family in: both children', !ci.error && ci.data.children.length === 2, JSON.stringify(ci))
  const marks = await rows(A.id, 'tp_attendance', q => q.eq('via', 'qr'))
  ok('… two attendance rows via qr at today’s weekend session', marks.length === 2 && (await rows(A.id, 'tp_sessions', q => q.eq('kind', 'weekend').eq('venue_id', small).eq('session_date', today))).length === 1)
  ok('B can’t check A’s family in, even naming its own venue', !!(await B.db.rpc('impact_family_checkin', { p_hq: B.id, p_venue: bVenue, p_code: fam.checkin_code })).error && !!(await B.db.rpc('impact_family_checkin', { p_hq: A.id, p_venue: small, p_code: fam.checkin_code })).error)
  const day = await A.db.rpc('impact_weekend_day', { p_hq: A.id, p_venue: small, p_date: today })
  ok('the day’s numbers', day.data?.checked_in_children === 2 && day.data.checked_in_families === 1, JSON.stringify(day))
  ok('B can’t see A’s numbers', !!(await B.db.rpc('impact_weekend_day', { p_hq: A.id, p_venue: small, p_date: today })).error)
  // The family's parent login.
  const pEmail = `${tag}_parent@lumio.test`
  const { data: { user: pu } } = await admin.auth.admin.createUser({ email: pEmail, email_confirm: true }); made.push(pu.id)
  await admin.from('impact_members').insert({ user_id: pu.id, hq_id: A.id, role: 'parent', family_id: fam.id, invited_email: pEmail, accepted_at: new Date().toISOString() })
  const P = await login(pEmail)
  const pw = await P.db.rpc('impact_parent_weekend')
  ok('parent: their venue and QR', pw.data?.[0]?.checkin_code === fam.checkin_code && pw.data[0].venue?.name === 'Kingsmead Rec Ground', JSON.stringify(pw))
  const sat = (() => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7)); return d.toISOString().slice(0, 10) })()
  ok('parent: “We’re coming”', !(await P.db.rpc('impact_parent_set_intent', { p_family: fam.id, p_date: sat, p_coming: true })).error)
  ok('… counted as expected for that day', (await A.db.rpc('impact_weekend_day', { p_hq: A.id, p_venue: small, p_date: sat })).data?.expected_children === 2)
  ok('parent can’t answer for another family', !!(await P.db.rpc('impact_parent_set_intent', { p_family: grace.id, p_date: sat, p_coming: true })).error)

  console.log('\nCross-org on the new tables:')
  for (const t of ['tp_community_signups', 'tp_weekend_intents']) {
    ok(`B reads none of A’s ${t}`, ((await B.db.from(t).select('id').eq('hq_id', A.id)).data ?? []).length === 0)
    ok(`signed out reads none of ${t}`, ((await createClient(SB, ANON).from(t).select('id')).data ?? []).length === 0)
  }
  ok('B can’t record a sign-up on A’s family', !!(await B.db.from('tp_community_signups').insert({ hq_id: B.id, family_id: fam.id, channel: 'hq' })).error)
  ok('A’s HQ can’t fake a form sign-up', !!(await A.db.from('tp_community_signups').insert({ hq_id: A.id, family_id: fam.id, channel: 'form' })).error)
  ok('the audit trail can’t be edited or deleted', ((await A.db.from('tp_community_signups').update({ channel: 'hq' }).eq('family_id', fam.id).select('id')).data ?? []).length === 0 && ((await A.db.from('tp_community_signups').delete().eq('family_id', fam.id).select('id')).data ?? []).length === 0)
  ok('B can’t read A’s families’ codes', ((await B.db.from('tp_families').select('checkin_code').eq('hq_id', A.id)).data ?? []).length === 0)
  ok('the parent can’t read the audit trail', ((await P.db.from('tp_community_signups').select('id')).data ?? []).length === 0)

  console.log('\nImport:')
  const records = { venues: [{ name: 'Netherby Green' }], families: [{ guardian_name: 'Imported Family', email: `imp+${tag}@example.com`, weekend_venue: 'Netherby Green', consent_data: 'yes' }] }
  const review = await A.call('/api/impact/import/plan', { mode: 'review', fileName: 'community.xlsx', records })
  const commit = await A.call('/api/impact/import/plan', { mode: 'commit', fileName: 'community.xlsx', key: review.body.key, records })
  const [impFam] = await rows(A.id, 'tp_families', q => q.eq('email', `imp+${tag}@example.com`))
  const impAudit = impFam ? await rows(A.id, 'tp_community_signups', q => q.eq('family_id', impFam.id)) : []
  ok('an imported family with a weekend venue joins Community, with an import sign-up row, stamped', commit.status === 200 && impFam?.source === 'community' && !!impFam.community_venue_id && impAudit[0]?.channel === 'import' && impAudit[0].import_batch_id === commit.body.importId, JSON.stringify(commit.body).slice(0, 200))
  const undo = await A.call('/api/impact/import/history', { id: commit.body.importId, action: 'undo' })
  ok('… and undo removes the family, venue and sign-up row', undo.status === 200 && (await rows(A.id, 'tp_families', q => q.eq('email', `imp+${tag}@example.com`))).length === 0 && (await rows(A.id, 'tp_community_signups', q => q.eq('channel', 'import'))).length === 0, JSON.stringify(undo.body))
}

try { await main() } catch (e) { fail++; console.error('  ✗ FAIL: stopped early:', e.stack ?? e) }
finally {
  for (const id of made) {
    await admin.from('impact_members').delete().eq('user_id', id)
    await admin.from('impact_orgs').delete().eq('hq_id', id)
    await admin.from('sports_profiles').delete().eq('id', id)
    await admin.auth.admin.deleteUser(id)
  }
  const left = await admin.from('impact_orgs').select('slug').like('slug', `${tag}%`)
  console.log(`\n${pass} passed, ${fail} failed. Throwaway orgs left: ${left.data?.length ?? 'unknown'}`)
}
process.exit(fail ? 1 : 0)
