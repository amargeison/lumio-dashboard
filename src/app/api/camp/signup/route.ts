import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { publicSiteOrigin } from '@/lib/public-origin'
import { sendCampSignupEmails, type SignupMailInput } from '@/lib/coach/camp-signup-email'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { foldedIntoConfirmation, STAGES, dueAt } from '@/lib/coach/camp-lifecycle'

export const runtime = 'nodejs'

// PUBLIC camp sign-up. No session — a parent following a link the coach shared.
//
// This runs on the service-role key with no authentication, which is the exact
// shape of the bug that leaked lead data in August. The discipline that keeps it
// safe:
//   • It only ever WRITES a sign-up. It never returns another attendee's details,
//     never returns coach contact details, and never confirms whether an email is
//     already known — so it cannot be used to enumerate anybody.
//   • Every query is scoped to the ONE camp resolved from the public slug, and
//     only when that camp has sign-ups open.
//   • The amount charged is read from the camp record server-side. Nothing about
//     money is taken from the request body.
//   • Capacity is enforced here, not in the browser.
//   • It is rate limited two ways. Per IP in memory, and per CAMP against the
//     database — because the duplicate guard only catches the same name AND the
//     same email on the same camp, so varying the name alone would otherwise
//     create unlimited player and attendee rows and unlimited Stripe sessions.

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}
const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max)

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const slug = clean(b.slug, 80).toLowerCase()
  const playerName = clean(b.player_name, 80)
  const parentName = clean(b.parent_name, 80)
  const parentEmail = clean(b.parent_email, 120).toLowerCase()

  if (!slug || !playerName || !parentEmail) {
    return NextResponse.json({ error: 'Please give the player’s name and your email address.' }, { status: 400 })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parentEmail)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 })
  }

  // Before any database work: a flood should cost us nothing.
  // Six in ten minutes is generous for a parent with three children and a typo,
  // and useless to anyone scripting it.
  const ip = clientIp(req.headers)
  const burst = rateLimit(`camp-signup:${ip}`, 6, 10 * 60_000)
  if (!burst.ok) {
    return NextResponse.json(
      { error: 'That is a lot of sign-ups at once. Give it a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(burst.retryAfterSeconds) } },
    )
  }
  const daily = rateLimit(`camp-signup-day:${ip}`, 30, 24 * 60 * 60_000)
  if (!daily.ok) {
    return NextResponse.json(
      { error: 'Too many sign-ups from this connection today. Please contact your coach directly.' },
      { status: 429, headers: { 'Retry-After': String(daily.retryAfterSeconds) } },
    )
  }

  const sb = db()
  try {
    const { data: camp } = await sb.from('coach_camps')
      .select('id, coach_id, name, capacity, price, payment_mode, deposit_amount, signup_open, start_date, end_date, location, region, parent_brief, daily_rhythm, signup_note, overseas')
      .ilike('signup_slug', slug).maybeSingle()

    // Same response whether the camp is missing or closed — a closed camp should
    // not be distinguishable from one that never existed.
    if (!camp || !camp.signup_open) {
      return NextResponse.json({ error: 'Sign-ups for this camp are not open.' }, { status: 404 })
    }

    // The real backstop. In-memory counters die with the process and are
    // per-worker; this one is neither. A camp legitimately fills in bursts when
    // a coach shares the link, so the ceiling is deliberately well above a busy
    // hour and only catches a machine.
    const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString()
    const { count: recent } = await sb.from('coach_camp_attendees')
      .select('id', { count: 'exact', head: true })
      .eq('camp_id', camp.id).eq('source', 'signup').gte('signed_up_at', hourAgo)
    if ((recent ?? 0) >= 60) {
      return NextResponse.json(
        { error: 'Sign-ups are busy right now. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': '600' } },
      )
    }

    const { count } = await sb.from('coach_camp_attendees')
      .select('id', { count: 'exact', head: true })
      .eq('camp_id', camp.id).neq('status', 'cancelled')
    const taken = count ?? 0
    if (camp.capacity && taken >= camp.capacity) {
      return NextResponse.json({ error: 'This camp is now full.' }, { status: 409 })
    }

    // Duplicate guard — a parent double-tapping submit should not take two places.
    const { data: dupe } = await sb.from('coach_camp_attendees')
      .select('id').eq('camp_id', camp.id).ilike('player_name', playerName).ilike('parent_email', parentEmail).maybeSingle()
    if (dupe) return NextResponse.json({ ok: true, already: true })

    // Roster record, so the camp feeds everything else (targets, reports, racket
    // progression). Matched on name within this coach only.
    const { data: existing } = await sb.from('coach_players')
      .select('id').eq('coach_id', camp.coach_id).ilike('name', playerName).maybeSingle()
    let playerId = existing?.id ?? null
    if (!playerId) {
      const { data: created } = await sb.from('coach_players').insert({
        coach_id: camp.coach_id, name: playerName,
        age: Number(b.player_age) || null,
        parent_name: parentName || null, parent_email: parentEmail,
        phone: clean(b.parent_phone, 40) || null,
        medical_notes: clean(b.medical_notes, 500) || null,
        consent_photo: !!b.consent_photo, consent_medical: !!b.consent_medical,
        consent_by: parentName || null, consent_date: new Date().toISOString().slice(0, 10),
      }).select('id').single()
      playerId = created?.id ?? null
    }

    // Money is decided HERE, from the camp record — never from the request.
    const mode = camp.payment_mode || 'none'
    const due = mode === 'full' ? Number(camp.price) || 0 : mode === 'deposit' ? Number(camp.deposit_amount) || 0 : 0
    const pennies = Math.round(due * 100)
    const needsPayment = mode !== 'none' && pennies >= 50

    const signedUpAt = new Date().toISOString()
    const { data: attendee } = await sb.from('coach_camp_attendees').insert({
      coach_id: camp.coach_id, camp_id: camp.id, player_id: playerId, player_name: playerName,
      parent_name: parentName || null, parent_email: parentEmail,
      parent_phone: clean(b.parent_phone, 40) || null,
      player_age: Number(b.player_age) || null,
      medical_notes: clean(b.medical_notes, 500) || null,
      emergency_contact: clean(b.emergency_contact, 160) || null,
      consent_photo: !!b.consent_photo, consent_medical: !!b.consent_medical,
      // A place is only held once the money is in — otherwise a full camp could be
      // filled by people who never pay.
      status: needsPayment ? 'pending' : 'confirmed',
      amount_pennies: needsPayment ? pennies : 0,
      // Always false on creation, whichever mode the camp is in. A camp with no
      // online payment is usually one where the coach takes the money in person,
      // so marking it paid here would inflate the Finance tab's collected total
      // for money nobody has received. The coach ticks it when it lands.
      paid: false,
      source: 'signup', signed_up_at: signedUpAt,
    }).select('id').single()

    // ── The late sign-up ──────────────────────────────────────────────────────
    // Someone who books a fortnight after the "everything you need" email went
    // out must not receive it, the two-week email and the week-to-go email all
    // at once. The countdown emails whose dates have already passed are written
    // off here as skipped, and the one that still matters — the details — is
    // folded into the confirmation below instead. The night-before email is
    // deliberately NOT written off: it is logistics, and they still need it.
    const folded = foldedIntoConfirmation(camp.start_date, Date.parse(signedUpAt))
    if (attendee?.id) {
      const past = STAGES.filter(st => {
        if (st.id === 'signup' || st.lateStill) return false
        const d = dueAt(st, camp.start_date)
        return d != null && d < Date.parse(signedUpAt)
      })
      if (past.length) {
        void sb.from('coach_camp_emails').insert(past.map(st => ({
          coach_id: camp.coach_id, camp_id: camp.id, attendee_id: attendee.id,
          stage: st.id, status: 'skipped',
          error: folded.includes(st.id)
            ? 'signed up late — folded into their confirmation'
            : 'signed up after this was due',
        }))).then(() => {}, () => {})
      }
    }

    const brief = (camp.parent_brief || {}) as Record<string, unknown>

    // Built once and reused: sent now when nothing is owed, or by the Stripe
    // webhook once the money is in. Either way the coach hears about it.
    const { data: prof } = await sb.from('sports_profiles')
      .select('brand_name, brand_logo_url, display_name, contact_email').eq('id', camp.coach_id).maybeSingle()
    const mail: SignupMailInput = {
      academy: prof?.brand_name || 'Tennis camp', logoUrl: prof?.brand_logo_url,
      coachName: prof?.display_name, coachEmail: prof?.contact_email,
      campName: camp.name, startDate: camp.start_date, endDate: camp.end_date,
      location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
      playerName, parentName: parentName || null, parentEmail,
      parentPhone: clean(b.parent_phone, 40) || null,
      playerAge: Number(b.player_age) || null,
      medicalNotes: clean(b.medical_notes, 500) || null,
      emergencyContact: clean(b.emergency_contact, 160) || null,
      consentPhoto: !!b.consent_photo, consentMedical: !!b.consent_medical,
      amountPennies: needsPayment ? pennies : 0, paymentMode: mode, paid: false,
      essentials: folded.includes('details') ? {
        dailyShape: (brief.dailyShape as string) || camp.daily_rhythm || null,
        whatToBring: (brief.whatToBring as string[]) || null,
        whatTheyWorkOn: (brief.whatTheyWorkOn as string[]) || null,
        note: camp.signup_note || null,
        overseas: !!camp.overseas,
      } : null,
    }

    if (!needsPayment) {
      // Not awaited — a slow mailbox must not hold a parent on a spinner.
      void sendCampSignupEmails(camp.coach_id, mail)
      return NextResponse.json({ ok: true, status: 'confirmed' })
    }

    // Direct charge onto the coach's connected account, same as the in-portal flow.
    const { data: acct } = await sb.from('coach_stripe').select('stripe_account_id, charges_enabled').eq('coach_id', camp.coach_id).maybeSingle()
    if (!acct?.stripe_account_id || !acct.charges_enabled) {
      // Payment is configured but the coach has not finished Stripe onboarding.
      // The sign-up still stands — better a pending place than a lost family.
      void sendCampSignupEmails(camp.coach_id, mail)
      return NextResponse.json({ ok: true, status: 'pending', note: 'Your place is reserved — the coach will send a payment link.' })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any })
    const origin = publicSiteOrigin(new URL(req.url).origin)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: parentEmail,
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: `${camp.name} — ${mode === 'deposit' ? 'deposit' : 'full payment'} for ${playerName}` }, unit_amount: pennies }, quantity: 1 }],
      success_url: `${origin}/camp/${slug}?signed_up=1`,
      cancel_url: `${origin}/camp/${slug}?cancelled=1`,
      metadata: { coach_id: camp.coach_id, camp_attendee_id: attendee?.id || '', camp_id: camp.id },
    }, { stripeAccount: acct.stripe_account_id })

    if (attendee?.id) await sb.from('coach_camp_attendees').update({ stripe_session_id: session.id }).eq('id', attendee.id)
    return NextResponse.json({ ok: true, status: 'pending', url: session.url })
  } catch (e) {
    console.error('[camp/signup]', e)
    // Deliberately vague to the public — details go to the server log.
    return NextResponse.json({ error: 'Something went wrong. Please try again, or contact your coach.' }, { status: 500 })
  }
}
