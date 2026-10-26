import { NextRequest, NextResponse } from 'next/server'
import { publicSiteOrigin } from '@/lib/public-origin'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { policyTerms } from '@/lib/coach/cancel-policy'
import { bacsReady, finishSetup, startCardSetup } from '@/app/api/coach/pay/_saved'
import { familyAddress, type FamilyPlayer } from '@/lib/coach/family-mail'
import { questionsFor, wordsFor, cleanAnswers, missing, minutesFor, SECTIONS, type Version } from '@/lib/coach/questionnaire'
import { planWords, coversWords, agreeText, monthWords } from '@/lib/coach/memberships'
import { loadWelcome, markIfComplete, type Welcome } from '@/lib/coach/welcome-server'
import { randomBytes } from 'crypto'
import { recordQuestion } from '@/lib/coach/recording-consent'

export const runtime = 'nodejs'

// A client's welcome link — /welcome/<token>, no account needed.
//
//   GET   what is still to do: the questionnaire, a card or Direct Debit (with
//         the cancellation policy), and agreeing to a monthly plan
//   POST  { action: 'answers', answers, health?, healthConsent? }
//         { action: 'record', ok }                   may lessons be recorded?
//         { action: 'agree', name }                  the monthly plan
//         { action: 'card', agree, name, method }    open Stripe's page
//         { action: 'cardDone', sessionId }          back from Stripe's page
//
// Health notes are kept only with the client's explicit consent (special
// category data under UK GDPR); without the tick they are not saved at all.

const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''
const methodWords = (c: Record<string, any> | null) => (c ? (c.kind === 'bacs_debit' ? `Direct Debit ending ${c.last4 || '••••'}` : `${c.brand ? c.brand.charAt(0).toUpperCase() + c.brand.slice(1) : 'Card'} ending ${c.last4 || '••••'}`) : null)

async function view(w: Welcome) {
  const toParent = !!familyAddress(w.player as FamilyPlayer)?.toParent
  const childFirst = toParent ? first(w.player.name) : null
  const v = (w.link.version === 'long' ? 'long' : 'short') as Version
  const dd = w.m.policy.directDebit && !!w.m.accountId && await bacsReady(w.m.accountId)
  const done = await markIfComplete(w)
  return {
    academy: w.m.academy, coachName: w.m.coachName || null, logoUrl: w.m.logoUrl, childFirst, playerFirst: first(w.player.name),
    version: v, minutes: minutesFor(v), done,
    sections: SECTIONS, questions: questionsFor(v).map(q => ({ id: q.id, section: q.section, kind: q.kind, text: wordsFor(q, childFirst), options: q.options || null, optional: !!q.optional, hint: q.hint || null })),
    answered: !!w.answered,
    recording: { ...recordQuestion({ coach: w.m.coachName || w.m.academy, childFirst }), answered: !!w.player.consent_record_how, ok: !!w.player.consent_record },
    card: { ready: !!w.m.accountId && w.m.chargesEnabled, directDebit: dd, saved: methodWords(w.card), terms: policyTerms(w.m.policy, w.m.academy) },
    plan: w.plan ? {
      name: w.plan.name, words: planWords(w.plan as { amount_pennies: number; day_of_month: number }), starts: monthWords(w.plan.starts_month),
      covers: coversWords(w.plan as { covers: 'lessons' | 'group' | 'none' }, w.groupName, childFirst), agreed: !!w.plan.agreed_at,
      text: agreeText(w.plan as never, w.m.academy, w.groupName),
    } : null,
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const w = await loadWelcome(token)
  if (!w) return NextResponse.json({ error: 'This link is not valid. Ask your coach to send a new one.' }, { status: 404 })
  if (!w.link.opened_at) await w.db.from('coach_welcome_links').update({ opened_at: new Date().toISOString() }).eq('id', w.link.id)
  return NextResponse.json(await view(w))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const limit = rateLimit(`welcome:${clientIp(req.headers)}`, 30, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  const w = await loadWelcome(token)
  if (!w) return NextResponse.json({ error: 'This link is not valid. Ask your coach to send a new one.' }, { status: 404 })
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const db = w.db

  if (b.action === 'answers') {
    const v = (w.link.version === 'long' ? 'long' : 'short') as Version
    const answers = cleanAnswers(v, b.answers)
    const left = missing(v, answers)
    if (left.length) return NextResponse.json({ error: `Please answer: ${left.map(q => wordsFor(q, null)).slice(0, 3).join(' · ')}`, missing: left.map(q => q.id) }, { status: 400 })
    const health = String(b.health || '').trim().slice(0, 1000)
    const consent = b.healthConsent === true && !!health
    // Health notes kept with consent are the player's medical notes too.
    if (consent) {
      await db.from('coach_players').update({ consent_medical: true, ...(!String(w.player.medical_notes || '').trim() ? { medical_notes: health } : {}) }).eq('id', w.player.id)
    }
    const { error } = await db.from('coach_questionnaires').insert({
      coach_id: w.link.coach_id, staff_id: w.link.staff_id || null, player_id: w.player.id, link_id: w.link.id, version: v,
      answers: consent ? { ...answers, health } : answers, health_consent: consent,
    })
    if (error) return NextResponse.json({ error: 'Your answers could not be saved. Please try again.' }, { status: 500 })
    const again = await loadWelcome(token)
    return NextResponse.json(await view(again || w))
  }

  if (b.action === 'record') {
    if (typeof b.ok !== 'boolean') return NextResponse.json({ error: 'Choose yes or no.' }, { status: 400 })
    const toParent = !!familyAddress(w.player as FamilyPlayer)?.toParent
    const by = (toParent ? w.player.parent_name : null) || w.player.name
    const { error } = await db.from('coach_players').update({
      consent_record: b.ok, consent_record_at: new Date().toISOString(), consent_record_by: String(by || '').slice(0, 80) || null, consent_record_how: b.ok ? 'welcome' : 'declined',
    }).eq('id', w.player.id)
    if (error) return NextResponse.json({ error: 'That could not be saved. Please try again.' }, { status: 500 })
    const again = await loadWelcome(token)
    return NextResponse.json(await view(again || w))
  }

  if (b.action === 'agree') {
    const name = String(b.name || '').trim().slice(0, 80)
    if (!w.plan || w.plan.agreed_at) return NextResponse.json(await view(w))
    if (name.length < 2) return NextResponse.json({ error: 'Please type your full name to agree.' }, { status: 400 })
    const now = new Date().toISOString()
    const { error } = await db.from('coach_memberships').update({
      agreed_at: now, agreed_by: name, agreed_text: agreeText(w.plan as never, w.m.academy, w.groupName), ...(w.plan.status === 'offered' ? { status: 'active' } : {}),
    }).eq('id', w.plan.id).is('agreed_at', null)
    if (error) return NextResponse.json({ error: 'That could not be saved. Please try again.' }, { status: 500 })
    const again = await loadWelcome(token)
    return NextResponse.json(await view(again || w))
  }

  if (b.action === 'card') {
    if (!w.m.accountId || !w.m.chargesEnabled) return NextResponse.json({ error: `${w.m.academy} cannot take card details just yet.` }, { status: 400 })
    const name = String(b.name || '').trim().slice(0, 80)
    if (b.agree !== true) return NextResponse.json({ error: 'Please read the cancellation policy and tick the box to agree to it.' }, { status: 400 })
    if (name.length < 2) return NextResponse.json({ error: 'Please type your full name.' }, { status: 400 })
    const wantsDd = b.method === 'bacs_debit'
    if (wantsDd && !(w.m.policy.directDebit && await bacsReady(w.m.accountId))) return NextResponse.json({ error: 'Direct Debit is not available. Please save a card instead.' }, { status: 400 })
    // The player's open card request, or a new one.
    const { data: open } = await db.from('coach_pay_methods').select('*').eq('coach_id', w.link.coach_id).eq('player_id', w.player.id).eq('status', 'invited')
      .order('created_at', { ascending: false }).limit(1)
    let row = open?.[0]
    if (!row) {
      const { data } = await db.from('coach_pay_methods').insert({ coach_id: w.link.coach_id, player_id: w.player.id, link_token: randomBytes(15).toString('base64url'), status: 'invited' }).select('*').single()
      row = data
    }
    if (!row) return NextResponse.json({ error: 'We could not open the secure card page. Please try again.' }, { status: 500 })
    const origin = publicSiteOrigin(new URL(req.url).origin)
    const r = await startCardSetup(db, w.m, row, w.player as never, { name, method: wantsDd ? 'bacs_debit' : 'card', back: `${origin}/welcome/${encodeURIComponent(token)}` })
    return r.url ? NextResponse.json({ url: r.url }) : NextResponse.json({ error: r.error }, { status: 500 })
  }

  if (b.action === 'cardDone') {
    const sessionId = String(b.sessionId || '')
    if (!/^cs_[A-Za-z0-9_]{6,200}$/.test(sessionId)) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 })
    const { data: row } = await db.from('coach_pay_methods').select('coach_id, player_id').eq('stripe_setup_session_id', sessionId).maybeSingle()
    // The session must be for this client.
    if (!row || row.coach_id !== w.link.coach_id || row.player_id !== w.player.id || !w.m.accountId) return NextResponse.json({ error: 'We could not match this to your coach’s request.' }, { status: 404 })
    const r = await finishSetup(db, w.m.accountId, sessionId)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    const again = await loadWelcome(token)
    return NextResponse.json(await view(again || w))
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
