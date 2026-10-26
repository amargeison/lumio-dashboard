// The welcome link on the server: making it, sending it, and reading where a
// client has got to with it (the questionnaire, their card or Direct Debit,
// and their monthly plan).

import { randomBytes } from 'crypto'
import { admin } from '@/app/api/coach/pay/_stripe'
import { academyMoney, activeMethod, type AcademyMoney } from '@/app/api/coach/pay/_saved'
import { familyAddress, sendFamilyEmail, type FamilyPlayer } from './family-mail'
import { welcomeMessage } from './welcome'
import { minutesFor, type Version } from './questionnaire'
import { planWords } from './memberships'

type Db = ReturnType<typeof admin>
type Row = Record<string, any>
const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''
export const PLAYER_COLS = 'id, name, email, parent_email, parent_name, contact_email, staff_id, consent_record, consent_record_how, consent_medical, medical_notes'

/** The player's open welcome link (one not finished yet), or a new one. */
export async function linkFor(db: Db, academyId: string, player: Row, version: Version): Promise<Row | null> {
  const { data: open } = await db.from('coach_welcome_links').select('*').eq('coach_id', academyId).eq('player_id', player.id).is('completed_at', null)
    .order('created_at', { ascending: false }).limit(1)
  if (open?.[0]) {
    if (open[0].version !== version && !open[0].opened_at) {
      await db.from('coach_welcome_links').update({ version, updated_at: new Date().toISOString() }).eq('id', open[0].id)
      open[0].version = version
    }
    return open[0]
  }
  const { data } = await db.from('coach_welcome_links').insert({ coach_id: academyId, staff_id: player.staff_id || null, player_id: player.id, token: randomBytes(18).toString('base64url'), version })
    .select('*').single()
  return data || null
}

/** The plan waiting for this player to agree to it, or the one running. */
export async function planFor(db: Db, academyId: string, playerId: string): Promise<Row | null> {
  const { data } = await db.from('coach_memberships').select('*').eq('coach_id', academyId).eq('player_id', playerId).in('status', ['offered', 'active', 'paused'])
    .order('created_at', { ascending: false }).limit(1)
  return data?.[0] || null
}

/** Email one welcome link. */
export async function sendWelcome(db: Db, senderId: string, m: AcademyMoney, player: Row, link: Row, origin: string): Promise<{ ok: boolean; to?: string; error?: string }> {
  const addr = familyAddress(player as FamilyPlayer)
  if (!addr) return { ok: false, error: `There is no email address for ${player.name}.` }
  const [card, plan] = await Promise.all([activeMethod(db, link.coach_id, player.id), planFor(db, link.coach_id, player.id)])
  const msg = welcomeMessage({
    hello: addr.hello, childFirst: addr.toParent ? first(player.name) : null, coachName: m.coachName || null, academy: m.academy, logoUrl: m.logoUrl,
    url: `${origin}/welcome/${link.token}`, minutes: minutesFor(link.version as Version),
    askCard: m.chargesEnabled && !card, askRecording: !player.consent_record_how, plan: plan && !plan.agreed_at ? planWords(plan as { amount_pennies: number; day_of_month: number }) : null,
  })
  const ok = await sendFamilyEmail(senderId, { to: addr.to, subject: msg.subject, html: msg.html, replyTo: m.contactEmail, context: 'coach/welcome link', push: { url: `${origin}/welcome/${link.token}` } })
  if (ok) await db.from('coach_welcome_links').update({ sent_at: new Date().toISOString(), sent_to: addr.to, updated_at: new Date().toISOString() }).eq('id', link.id)
  return ok ? { ok, to: addr.to } : { ok, error: `The email to ${addr.to} did not send.` }
}

export type Welcome = { db: Db; link: Row; player: Row; m: AcademyMoney; plan: Row | null; card: Row | null; answered: Row | null; groupName: string | null }

export async function loadWelcome(token: string): Promise<Welcome | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null
  const db = admin()
  const { data: link } = await db.from('coach_welcome_links').select('*').eq('token', token).maybeSingle()
  if (!link) return null
  const { data: player } = await db.from('coach_players').select(PLAYER_COLS).eq('id', link.player_id).maybeSingle()
  if (!player) return null
  const [m, plan, card, { data: answered }] = await Promise.all([
    academyMoney(db, link.coach_id), planFor(db, link.coach_id, player.id), activeMethod(db, link.coach_id, player.id),
    db.from('coach_questionnaires').select('id, version, submitted_at').eq('coach_id', link.coach_id).eq('player_id', player.id).order('submitted_at', { ascending: false }).limit(20),
  ])
  const { data: g } = plan?.group_id ? await db.from('coach_groups').select('name').eq('id', plan.group_id).maybeSingle() : { data: null }
  // Answered already — on this link or an earlier one — needs no asking again,
  // unless this link asks the long questions and they only did the short ones.
  const done = (answered || []).find(q => q.version === 'long' || q.version === link.version) || null
  return { db, link, player, m, plan, card, answered: done, groupName: (g?.name as string) || null }
}

/** Finished when the questions are answered, recording has been asked about, a card is saved (if the coach takes cards) and any plan is agreed. */
export async function markIfComplete(w: Welcome): Promise<boolean> {
  const done = !!w.answered && !!w.player.consent_record_how && (!!w.card || !w.m.chargesEnabled) && (!w.plan || !!w.plan.agreed_at)
  if (done && !w.link.completed_at) {
    w.link.completed_at = new Date().toISOString()
    await w.db.from('coach_welcome_links').update({ completed_at: w.link.completed_at, updated_at: w.link.completed_at }).eq('id', w.link.id)
  }
  return done
}

export { academyMoney }
