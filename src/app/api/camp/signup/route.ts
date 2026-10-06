import { NextRequest, NextResponse } from 'next/server'
import { demoCampBySignupSlug } from '@/lib/coach/demo-public'
import { formLinkFor } from '@/lib/coach/camp-form-server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { publicSiteOrigin } from '@/lib/public-origin'
import { sendCampSignupEmails, type SignupMailInput } from '@/lib/coach/camp-signup-email'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { foldedIntoConfirmation, STAGES, dueAt } from '@/lib/coach/camp-lifecycle'
import { isAdult } from '@/lib/coach/camp-audience'
import { londonToday } from '@/lib/coach/booking-slots'

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
//     only when that camp has sign-ups open. The slug, the name and the email
//     are matched EXACTLY — never as a pattern, where "_" and "%" mean
//     "anything" and turn a look-up into a way of guessing other families.
//   • Signing up twice gets the same answer as signing up once. The form never
//     says "already signed up": that sentence confirmed to a stranger that a
//     named child was on the camp and whose email went with them.
//   • The place is taken in ONE step in the database (lumio_camp_signup,
//     migration 197), which locks the camp while it counts and writes — so the
//     last place cannot be given to six families who pressed the button together.
//   • It only says "booked in" when the row was saved.
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
/** A public address is lower-case letters, digits and hyphens — the only
    characters the portal ever puts in one. Anything else is not a camp. */
const SLUG_RE = /^[a-z0-9-]{1,80}$/
/** An address that could actually receive the confirmation: an ordinary local
    part, and a domain made of letters, digits, dots and hyphens. "%@%.%" is not
    one. */
const EMAIL_RE = /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i
// One "you're already on the list" email per place per hour, however many times
// the form is sent.
const RESEND_EVERY = 60 * 60_000

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const slug = clean(b.slug, 80).toLowerCase()
  // Names are stored tidy — one space between words — so the same child typed
  // with a stray space is still the same child.
  const playerName = clean(b.player_name, 80).replace(/\s+/g, ' ')
  const parentName = clean(b.parent_name, 80).replace(/\s+/g, ' ')
  const parentEmail = clean(b.parent_email, 120).toLowerCase()

  if (!slug || !playerName || !parentEmail) {
    return NextResponse.json({ error: 'Please give the player’s name and your email address.' }, { status: 400 })
  }
  // A name has letters in it.
  if (!/\p{L}/u.test(playerName)) {
    return NextResponse.json({ error: 'Please give the player’s name.' }, { status: 400 })
  }
  // Age is optional, but when given it is a whole number of years. "7.5" used
  // to be thanked and emailed while the database quietly refused to store it.
  const ageRaw = b.player_age
  let playerAge: number | null = null
  if (ageRaw != null && String(ageRaw).trim() !== '') {
    const n = /^\d{1,3}$/.test(String(ageRaw).trim()) ? Number(ageRaw) : NaN
    if (!Number.isInteger(n) || n < 2 || n > 110) {
      return NextResponse.json({ error: 'Please give the age as a whole number of years, or leave it blank.' }, { status: 400 })
    }
    playerAge = n
  }
  if (!EMAIL_RE.test(parentEmail)) {
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
    const { data: camp, error: campErr } = await sb.from('coach_camps')
      .select('id, coach_id, name, capacity, price, payment_mode, deposit_amount, signup_open, start_date, end_date, location, region, parent_brief, daily_rhythm, signup_note, overseas, audience')
      .eq('signup_slug', SLUG_RE.test(slug) ? slug : '').maybeSingle()

    if (campErr) throw new Error(`camp lookup: ${campErr.message}`)

    // Same response whether the camp is missing or closed — a closed camp should
    // not be distinguishable from one that never existed.
    if (!camp || !camp.signup_open) {
      // A sign-up on one of the DEMO academy's camp pages: thanked, and thrown
      // away. Nothing is stored, nobody is emailed, no payment is started.
      if (!camp && demoCampBySignupSlug(slug)) return NextResponse.json({ ok: true, status: 'confirmed', demo: true })
      return NextResponse.json({ error: 'Sign-ups for this camp are not open.' }, { status: 404 })
    }
    // A camp that has finished takes no more sign-ups, whatever the switch says.
    if (campIsOver(camp)) {
      return NextResponse.json({ error: 'This camp has finished, so sign-ups are closed.' }, { status: 409 })
    }

    // The real backstop. In-memory counters die with the process and are
    // per-worker; this one is neither. A camp legitimately fills in bursts when
    // a coach shares the link, so the ceiling is deliberately well above a busy
    // hour and only catches a machine.
    const hourAgo = new Date(Date.now() - 60 * 60_000).toISOString()
    const { count: recent, error: recentErr } = await sb.from('coach_camp_attendees')
      .select('id', { count: 'exact', head: true })
      .eq('camp_id', camp.id).eq('source', 'signup').gte('signed_up_at', hourAgo)
    if (recentErr) throw new Error(`sign-up count: ${recentErr.message}`)
    if ((recent ?? 0) >= 60) {
      return NextResponse.json(
        { error: 'Sign-ups are busy right now. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': '600' } },
      )
    }

    // Money is decided HERE, from the camp record — never from the request.
    const mode = camp.payment_mode || 'none'
    const due = mode === 'full' ? Number(camp.price) || 0 : mode === 'deposit' ? Number(camp.deposit_amount) || 0 : 0
    const pennies = Math.round(due * 100)
    const needsPayment = mode !== 'none' && pennies >= 50

    // An adult camp is somebody booking their own place; on a mixed camp their
    // own age decides. They go on the roster as an adult with their own email,
    // not as a child whose "parent email" happens to be theirs.
    const adult = isAdult(camp, playerAge)
    const phone = clean(b.parent_phone, 40)
    const medical = clean(b.medical_notes, 500)
    const emergency = clean(b.emergency_contact, 160)

    // ── The place ─────────────────────────────────────────────────────────
    // Capacity, the duplicate check, the roster record and the attendee row are
    // one locked step in the database. See migration 197 for the rules — in
    // particular, a sign-up is tied to an existing player only when the name
    // AND the email typed are both already on that player's record.
    const signedUpAt = new Date().toISOString()
    const { data: made, error: saveErr } = await sb.rpc('lumio_camp_signup', {
      p_camp_id: camp.id,
      p: {
        player_name: playerName, email: parentEmail, parent_name: adult ? '' : parentName,
        phone, player_age: playerAge, medical_notes: medical, emergency_contact: emergency,
        consent_photo: !!b.consent_photo, consent_medical: !!b.consent_medical,
        adult,
        // A place is only held once the money is in — otherwise a full camp
        // could be filled by people who never pay. Never marked paid here: a
        // camp with no online payment is usually one where the coach takes the
        // money in person, and they tick it when it lands.
        status: needsPayment ? 'pending' : 'confirmed',
        amount_pennies: needsPayment ? pennies : 0,
      },
    })
    if (saveErr) {
      console.error('[camp/signup] could not save the sign-up', saveErr)
      return NextResponse.json({ error: 'We could not save that sign-up. Please try again, or contact your coach.' }, { status: 500 })
    }
    const saved = (made || {}) as { result?: string; attendee_id?: string; status?: string; paid?: boolean }
    if (saved.result === 'full') {
      // The same answer for everybody once the camp is full — including somebody
      // already on the list, who used to be told "ok", which let a stranger
      // check whether a named child and an email address were on the camp. The
      // family that IS on it still gets its confirmation again, by email, at
      // the address already on the place.
      if (saved.attendee_id && rateLimit(`camp-signup-again:${saved.attendee_id}`, 1, RESEND_EVERY).ok) {
        void resendConfirmation(sb, camp, saved.attendee_id, publicSiteOrigin(new URL(req.url).origin))
      }
      return NextResponse.json({ error: 'This camp is now full.' }, { status: 409 })
    }
    if (saved.result === 'finished') return NextResponse.json({ error: 'This camp has finished, so sign-ups are closed.' }, { status: 409 })
    if (saved.result === 'closed') return NextResponse.json({ error: 'Sign-ups for this camp are not open.' }, { status: 404 })

    // Already on the list under this name and this email. The answer on screen
    // is the same as for a first sign-up; the email — which goes only to the
    // address already on that place — is what says "you're already booked in".
    // A place still waiting for payment carries on to the payment page, so a
    // parent who closed it by accident can simply sign up again.
    const duplicate = saved.result === 'duplicate'
    if (duplicate && !(needsPayment && saved.status === 'pending' && !saved.paid)) {
      if (saved.attendee_id && rateLimit(`camp-signup-again:${saved.attendee_id}`, 1, RESEND_EVERY).ok) {
        void resendConfirmation(sb, camp, saved.attendee_id, publicSiteOrigin(new URL(req.url).origin))
      }
      // The answer on screen must not say whether this pair was already on the
      // list. On a camp that takes money a first sign-up is told "pending", so
      // that is what this is told too (it used to say "confirmed" — a
      // difference a stranger could read). Nothing is charged: where the page
      // would normally go on to the card payment, this goes to the page's own
      // "you're signed up" screen instead.
      if (!needsPayment) return NextResponse.json({ ok: true, status: 'confirmed' })
      const { data: stripeAcct } = await sb.from('coach_stripe').select('stripe_account_id, charges_enabled').eq('coach_id', camp.coach_id).maybeSingle()
      if (!stripeAcct?.stripe_account_id || !stripeAcct.charges_enabled) {
        return NextResponse.json({ ok: true, status: 'pending', note: 'Your place is reserved — the coach will send a payment link.' })
      }
      return NextResponse.json({ ok: true, status: 'pending', url: `${publicSiteOrigin(new URL(req.url).origin)}/camp/${slug}?signed_up=1` })
    }
    if ((saved.result !== 'ok' && !duplicate) || !saved.attendee_id) {
      console.error('[camp/signup] could not save the sign-up', made)
      return NextResponse.json({ error: 'We could not save that sign-up. Please try again, or contact your coach.' }, { status: 500 })
    }
    const attendee = { id: saved.attendee_id }

    // ── The late sign-up ──────────────────────────────────────────────────────
    // Someone who books a fortnight after the "everything you need" email went
    // out must not receive it, the two-week email and the week-to-go email all
    // at once. The countdown emails whose dates have already passed are written
    // off here as skipped, and the one that still matters — the details — is
    // folded into the confirmation below instead. The night-before email is
    // deliberately NOT written off: it is logistics, and they still need it.
    const folded = foldedIntoConfirmation(camp.start_date, Date.parse(signedUpAt))
    if (!duplicate) {
      const past = STAGES.filter(st => {
        if (st.id === 'signup' || st.lateStill) return false
        const d = dueAt(st, camp.start_date, camp.end_date)
        return d != null && d < Date.parse(signedUpAt)
      })
      if (past.length) {
        void sb.from('coach_camp_emails').insert(past.map(st => ({
          coach_id: camp.coach_id, camp_id: camp.id, attendee_id: attendee.id,
          stage: st.id, status: 'skipped',
          // The date this was judged against, so it is judged again if the camp moves.
          due_at: new Date(dueAt(st, camp.start_date, camp.end_date) as number).toISOString(),
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
      formUrl: await formLinkFor(sb, attendee.id, publicSiteOrigin(new URL(req.url).origin)),
      academy: prof?.brand_name || 'Tennis camp', logoUrl: prof?.brand_logo_url,
      coachName: prof?.display_name, coachEmail: prof?.contact_email,
      campName: camp.name, startDate: camp.start_date, endDate: camp.end_date,
      location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
      playerName, parentName: adult ? null : parentName || null, parentEmail,
      parentPhone: phone || null,
      playerAge,
      medicalNotes: medical || null,
      emergencyContact: emergency || null,
      consentPhoto: !!b.consent_photo, consentMedical: !!b.consent_medical,
      amountPennies: needsPayment ? pennies : 0, paymentMode: mode, paid: false,
      audience: camp.audience,
      // An adult camp writes to the player; a junior camp writes to whoever
      // signed them up. Their own age can still override on a mixed camp.
      toParent: !adult,
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
      void sendCampSignupEmails(camp.coach_id, mail, { campId: camp.id, attendeeId: attendee.id })
      return NextResponse.json({ ok: true, status: 'confirmed' })
    }

    // Direct charge onto the coach's connected account, same as the in-portal flow.
    const { data: acct } = await sb.from('coach_stripe').select('stripe_account_id, charges_enabled').eq('coach_id', camp.coach_id).maybeSingle()
    if (!acct?.stripe_account_id || !acct.charges_enabled) {
      // Payment is configured but the coach has not finished Stripe onboarding.
      // The sign-up still stands — better a pending place than a lost family.
      if (!duplicate) void sendCampSignupEmails(camp.coach_id, mail, { campId: camp.id, attendeeId: attendee.id })
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
      metadata: { coach_id: camp.coach_id, camp_attendee_id: attendee.id, camp_id: camp.id },
    }, { stripeAccount: acct.stripe_account_id })

    const { error: linkErr } = await sb.from('coach_camp_attendees').update({ stripe_session_id: session.id }).eq('id', attendee.id)
    // Without this the payment could not be matched back to the place, so do
    // not send them off to pay.
    if (linkErr) {
      console.error('[camp/signup] could not record the payment session', linkErr)
      return NextResponse.json({ error: 'We could not start the payment. Please try again, or contact your coach.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, status: 'pending', url: session.url })
  } catch (e) {
    console.error('[camp/signup]', e)
    // Deliberately vague to the public — details go to the server log.
    return NextResponse.json({ error: 'Something went wrong. Please try again, or contact your coach.' }, { status: 500 })
  }
}

/** Has the camp's last day gone? Judged on the UK calendar, like every other
    date in the portal. A camp with no dates has not finished. */
function campIsOver(camp: { start_date?: string | null; end_date?: string | null }): boolean {
  const last = String(camp.end_date || camp.start_date || '').slice(0, 10)
  return !!last && last < londonToday()
}

/**
 * "You're already booked in" — for somebody who signs up a second time.
 *
 * Built ONLY from the place already saved and sent ONLY to the address already
 * on it, so sending the form again with somebody else's details tells the
 * sender nothing and changes nothing. No copy to the coach: nothing happened.
 */
async function resendConfirmation(
  sb: ReturnType<typeof db>,
  camp: { id: string; coach_id: string; name: string; start_date?: string | null; end_date?: string | null; location?: string | null; region?: string | null; audience?: string | null },
  attendeeId: string, origin: string,
) {
  try {
    const [{ data: a }, { data: prof }] = await Promise.all([
      sb.from('coach_camp_attendees')
        .select('id, player_name, parent_name, parent_email, player_age, amount_pennies, paid')
        .eq('id', attendeeId).eq('camp_id', camp.id).maybeSingle(),
      sb.from('sports_profiles').select('brand_name, brand_logo_url, display_name, contact_email').eq('id', camp.coach_id).maybeSingle(),
    ])
    if (!a?.parent_email) return
    await sendCampSignupEmails(camp.coach_id, {
      formUrl: await formLinkFor(sb, a.id, origin),
      academy: prof?.brand_name || 'Tennis camp', logoUrl: prof?.brand_logo_url,
      coachName: prof?.display_name,
      // Reply-to only. With no coachEmail the coach's own copy is not sent.
      coachEmail: null,
      campName: camp.name, startDate: camp.start_date, endDate: camp.end_date,
      location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
      playerName: a.player_name, parentName: a.parent_name || null, parentEmail: a.parent_email,
      playerAge: a.player_age ?? null,
      amountPennies: a.amount_pennies || 0, paid: !!a.paid,
      audience: camp.audience,
      toParent: !isAdult(camp, a.player_age ?? null),
    })
  } catch (e) { console.error('[camp/signup] resend', e) }
}
