// The camp player-information form: its shape, the standard questions, and how
// answers are filed. Shared by the coach's editor, the public page, the API and
// the emails, so all four agree on what the form IS for a given camp.
//
// No server-only imports here — the coach portal and the public page both
// bundle this file.

export type QType = 'short' | 'long' | 'choice' | 'checks' | 'dropdown' | 'date' | 'time'
export const Q_TYPES: [QType, string][] = [
  ['short', 'Short answer'], ['long', 'Paragraph'], ['choice', 'Pick one'], ['checks', 'Tick any'],
  ['dropdown', 'Drop-down'], ['date', 'Date'], ['time', 'Time'],
]

export type FormQuestion = {
  id: string
  label: string
  help?: string
  type: QType
  required?: boolean
  options?: string[]
  /** Only asked when the camp is overseas (flights, rooms, passport name, insurance). */
  trip?: boolean
  /** What the answer means to Lumio, so it can be filed on the attendee as well
   *  as kept in the form — the emergency contact, the medical note, the goal. */
  key?: string
}
export type FormSection = { id: string; title: string; help?: string; trip?: boolean; questions: FormQuestion[] }
export type InfoForm = {
  /** false = no form for this camp: no link in any email, and the link closes. */
  enabled?: boolean
  intro?: string
  sections: FormSection[]
}
export type FormCamp = { name?: string | null; audience?: string | null; overseas?: boolean | null; info_form?: unknown }
export type Answers = Record<string, string | string[]>

const ADULT_SHIRTS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const JUNIOR_SHIRTS = ['Age 5–6', 'Age 7–8', 'Age 9–10', 'Age 11–12', 'Age 13–14', ...ADULT_SHIRTS.map(s => `Adult ${s}`)]

/**
 * The standard form for a camp. Written once in two voices: an adult camp
 * speaks to the player ("your level"); anything else speaks to whoever is
 * filling it in for a child ("their level"). Questions marked `trip` are part
 * of the form but only ever ASKED when the camp is overseas — nobody going to
 * a half-term camp down the road should be asked for a flight number.
 */
export function defaultInfoForm(camp: FormCamp): InfoForm {
  const adult = camp.audience === 'adult'
  const v = (a: string, j: string) => adult ? a : j
  return {
    enabled: true,
    intro: v(
      'This takes about five minutes and tells me everything I need to organise your group and look after you properly. Anything you tell me here stays between us and the coaching team.',
      'This takes about five minutes and tells me everything I need to organise the groups and look after your child properly. Anything you tell me here stays between us and the coaching team.'),
    sections: [
      {
        id: 'details', title: v('Your details', 'Player details'), questions: [
          // One name question. Abroad, it has to be the passport's spelling,
          // because that is what the flight and the hotel booking are checked against.
          camp.overseas
            ? { id: 'full_name', key: 'full_name', type: 'short', required: true, label: v('Full name, exactly as it appears on your passport', 'Player’s full name, exactly as it appears on their passport'), help: 'Flights and hotel bookings have to match the passport.' }
            : { id: 'full_name', key: 'full_name', type: 'short', required: true, label: v('Full name', 'Player’s full name') },
          { id: 'preferred_name', key: 'preferred_name', type: 'short', label: 'Preferred name', help: v('What you would like to be called (also written on court and group listings).', 'What they like to be called (also written on court and group listings).') },
          { id: 'phone', key: 'phone', type: 'short', required: true, label: v('Mobile number', 'Your mobile number'), help: v('Include the country code if it is not a UK number.', 'The number to ring during the camp. Include the country code if it is not a UK number.') },
          { id: 'dob', key: 'dob', type: 'date', label: v('Date of birth', 'Player’s date of birth') },
          { id: 'address', key: 'address', type: 'long', trip: true, label: 'Home address' },
          { id: 'ec_name', key: 'ec_name', type: 'short', required: true, label: 'Emergency contact: name', help: v('Someone who is NOT on the camp with you.', 'A second person we can ring if we cannot reach you.') },
          { id: 'ec_relation', key: 'ec_relation', type: 'short', required: true, label: v('Emergency contact: relationship to you', 'Emergency contact: relationship to the player') },
          { id: 'ec_phone', key: 'ec_phone', type: 'short', required: true, label: 'Emergency contact: phone number' },
          ...(adult ? [] : [{ id: 'pickup', key: 'pickup', type: 'long' as QType, label: 'Who will drop off and collect them each day?', help: 'Names of anyone allowed to collect, and whether they may leave on their own.' }]),
        ],
      },
      {
        id: 'travel', title: 'Travel', trip: true, help: 'One flight per line please. This builds the transfer list, so exact flight numbers save a lot of chasing.', questions: [
          { id: 'out_airline', key: 'out_airline', type: 'short', required: true, trip: true, label: 'Outbound: airline' },
          { id: 'out_flight', key: 'out_flight', type: 'short', required: true, trip: true, label: 'Outbound: flight number', help: 'For example EZY8215.' },
          { id: 'out_airport', key: 'out_airport', type: 'short', required: true, trip: true, label: 'Outbound: arrival airport' },
          { id: 'out_date', key: 'out_date', type: 'date', required: true, trip: true, label: 'Outbound: arrival date' },
          { id: 'out_time', key: 'out_time', type: 'time', required: true, trip: true, label: 'Outbound: scheduled arrival time' },
          { id: 'ret_flight', key: 'ret_flight', type: 'short', required: true, trip: true, label: 'Return: flight number' },
          { id: 'ret_date', key: 'ret_date', type: 'date', required: true, trip: true, label: 'Return: departure date' },
          { id: 'ret_time', key: 'ret_time', type: 'time', required: true, trip: true, label: 'Return: scheduled departure time' },
          { id: 'transfer', key: 'transfer', type: 'choice', required: true, trip: true, label: 'Group airport transfer', options: ['Both ways', 'Outbound only', 'Return only', 'Neither, I am making my own way'] },
          { id: 'travel_notes', key: 'travel_notes', type: 'long', trip: true, label: 'If you are travelling on different dates or staying somewhere else, tell me here', help: 'For example arriving a day early, staying on afterwards, or a different hotel before or after the camp. It helps me get the transfers right.' },
        ],
      },
      {
        id: 'room', title: v('Your room', 'Rooming'), trip: true, questions: [
          { id: 'room', key: 'room', type: 'choice', required: true, trip: true, label: 'Room', help: 'Edit these options to match the rooms and upgrades on this trip.', options: ['Standard room, included', 'Single room (supplement applies)', 'Upgrade — please contact me'] },
          { id: 'room_share', key: 'room_share', type: 'short', trip: true, label: v('Who are you sharing with, if anyone?', 'Who would they like to share with?') },
        ],
      },
      {
        id: 'tennis', title: v('Your tennis', 'Their tennis'), help: v('More useful if I have not seen you play recently.', 'More useful if I have not coached them before.'), questions: [
          { id: 'level', key: 'level', type: 'short', required: true, label: v('Your current level', 'Their current level'), help: v('Describe your standard, and who and where you usually play.', 'How long they have played, and where — club, school, lessons, squads.') },
          { id: 'frequency', key: 'frequency', type: 'choice', required: true, label: v('How often do you currently play?', 'How often do they currently play?'), options: ['Less than once a week', 'Once a week', 'Two or three times a week', 'Four or more times a week'] },
          ...(adult ? [{ id: 'format', key: 'format', type: 'choice' as QType, required: true, label: 'What kind of tennis do you usually prefer?', help: 'This helps with the coaching themes and match play.', options: ['Singles', 'Doubles', 'Both'] }] : []),
          { id: 'handed', key: 'handed', type: 'choice', required: true, label: 'Right or left handed?', options: ['Right', 'Left'] },
          { id: 'injury', key: 'injury', type: 'long', required: true, label: v('Do you have any injury concerns I should be aware of?', 'Any injuries or physical concerns I should be aware of?'), help: 'Put “none” if not.' },
          { id: 'goal', key: 'goal', type: 'long', required: true, label: v('What part of your game would you most like to work on?', 'What would they most like to get better at this week?'), help: 'Be as specific as you can. “Second serve” beats “serve”.' },
          { id: 'shirt', key: 'shirt', type: 'dropdown', label: 'Shirt size', help: 'In case there is a camp shirt.', options: adult ? ADULT_SHIRTS : JUNIOR_SHIRTS },
          { id: 'video', key: 'video', type: 'long', label: v('Optional: send me a short video of you playing', 'Optional: send me a short video of them playing'), help: v('30 seconds to 2 minutes is plenty and phone footage from any angle is fine. A rally and a few serves is ideal. It is genuinely not essential, but if I have not seen you play it makes the first morning far quicker to organise. Email or WhatsApp it to me, then just put “sent” or “to be sent” below.', '30 seconds to 2 minutes is plenty and phone footage from any angle is fine. A rally and a few serves is ideal. It is genuinely not essential, but if I have not seen them play it makes the first morning far quicker to organise. Email or WhatsApp it to me, then just put “sent” or “to be sent” below.') },
        ],
      },
      {
        id: 'health', title: v('Health, insurance and admin', 'Health and admin'), questions: [
          { id: 'dietary', key: 'dietary', type: 'long', required: true, label: v('Do you have any dietary requirements, allergies or preferences?', 'Any dietary requirements or allergies?'), help: 'Put “none” if not.' },
          { id: 'medical', key: 'medical', type: 'long', required: true, label: 'Any other medical issues I should be aware of?', help: 'Conditions or medication that would matter in an emergency. Put “none” if not.' },
          { id: 'insurance', key: 'insurance', type: 'choice', required: true, trip: true, label: 'Travel insurance: have you booked?', help: 'Travel insurance is required and is your own responsibility to arrange. Do check your policy covers playing tennis — many standard policies limit or exclude sporting activity.', options: ['Yes', 'Not yet, but I will before we travel'] },
          { id: 'photo', key: 'photo', type: 'choice', required: true, label: 'Photos and video', help: v('I sometimes post clips and photos from camps and use them in marketing. Are you happy to appear? You can change your mind at any point — just tell me.', 'I sometimes post clips and photos from camps and use them in marketing. Are you happy for your child to appear? You can change your mind at any point — just tell me.'), options: ['Yes', 'No'] },
          { id: 'anything', key: 'anything', type: 'long', label: v('Anything else I should know, or anything you would like from the week?', 'Anything else I should know?') },
        ],
      },
    ],
  }
}

const str = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const TYPES = new Set(Q_TYPES.map(t => t[0]))

/** Whatever was saved, made safe: only known types, bounded sizes, unique ids. */
export function tidyForm(raw: unknown): InfoForm | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as { enabled?: unknown; intro?: unknown; sections?: unknown }
  if (!Array.isArray(r.sections)) return null
  const seen = new Set<string>()
  const uid = (want: unknown, prefix: string) => {
    let id = str(want, 40).replace(/[^a-zA-Z0-9_-]/g, '') || `${prefix}${seen.size + 1}`
    while (seen.has(id)) id = `${id}x`
    seen.add(id); return id
  }
  const sections: FormSection[] = (r.sections as Record<string, unknown>[]).slice(0, 12).map(s => ({
    id: uid(s?.id, 's'), title: str(s?.title, 120) || 'Section', help: String(s?.help ?? '').trim().slice(0, 800) || undefined, trip: s?.trip === true || undefined,
    questions: (Array.isArray(s?.questions) ? s.questions as Record<string, unknown>[] : []).slice(0, 40).map(q => {
      const type = TYPES.has(q?.type as QType) ? q.type as QType : 'short'
      const options = ['choice', 'checks', 'dropdown'].includes(type) ? (Array.isArray(q?.options) ? q.options : []).map(o => str(o, 160)).filter(Boolean).slice(0, 30) : undefined
      return {
        id: uid(q?.id, 'q'), label: str(q?.label, 300) || 'Question', help: String(q?.help ?? '').trim().slice(0, 1500) || undefined,
        type, required: q?.required === true || undefined, options, trip: q?.trip === true || undefined, key: str(q?.key, 40) || undefined,
      }
    }),
  }))
  return { enabled: r.enabled !== false, intro: String(r.intro ?? '').trim().slice(0, 2000) || undefined, sections }
}

/**
 * The camp's form as the coach left it, or the standard one. Includes trip questions.
 *
 * What is saved on the camp is one of three things: nothing (the standard form,
 * on), `{ enabled: false }` (the standard form, switched off), or a whole form
 * (the coach's own version). The middle one matters: switching the form off
 * and on again used to save a full copy of the standard form, which froze its
 * wording — no passport question if the camp was later marked abroad.
 */
export function campForm(camp: FormCamp): InfoForm {
  const own = tidyForm(camp.info_form)
  if (own) return own
  const off = !!camp.info_form && typeof camp.info_form === 'object' && (camp.info_form as { enabled?: unknown }).enabled === false
  return { ...defaultInfoForm(camp), enabled: !off }
}
export const formIsCustom = (camp: FormCamp) => !!tidyForm(camp.info_form)
export const formEnabled = (camp: FormCamp) => campForm(camp).enabled !== false

/** What is actually ASKED on this camp: trip questions drop out unless it is overseas. */
export function askedForm(camp: FormCamp): InfoForm {
  const f = campForm(camp)
  const abroad = !!camp.overseas
  return {
    ...f,
    sections: f.sections.filter(s => abroad || !s.trip)
      .map(s => ({ ...s, questions: s.questions.filter(q => abroad || !q.trip) }))
      .filter(s => s.questions.length > 0),
  }
}

/**
 * Required questions this attendee has not answered — including ones added
 * after they sent the form (a new question, or a camp since marked abroad).
 */
// (The index signature is what lets the full attendee row be passed in — without
// it TypeScript refuses a row that has thirty other fields and none of these.)
export function formOutstanding(camp: FormCamp, a: { form_answers?: unknown; [k: string]: unknown }): string[] {
  return cleanAnswers(askedForm(camp), a.form_answers).missing
}

/**
 * Has this attendee finished the form AS IT IS ASKED TODAY? Sending it once is
 * not enough if the coach has since added something they must answer: they are
 * asked for just those, and chased with everybody else until they have.
 */
export function formDone(camp: FormCamp, a: { form_submitted_at?: unknown; form_answers?: unknown; [k: string]: unknown }): boolean {
  return !!a.form_submitted_at && formOutstanding(camp, a).length === 0
}

/** Keep only answers to questions that are being asked, in the shape each expects. */
export function cleanAnswers(form: InfoForm, raw: unknown): { answers: Answers; missing: string[] } {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const answers: Answers = {}
  const missing: string[] = []
  for (const s of form.sections) for (const q of s.questions) {
    const v = input[q.id]
    let out: string | string[] = ''
    if (q.type === 'checks') {
      out = (Array.isArray(v) ? v : []).map(x => str(x, 160)).filter(x => !q.options?.length || q.options.includes(x)).slice(0, 30)
    } else if (q.type === 'choice' || q.type === 'dropdown') {
      const t = str(v, 160); out = !q.options?.length || q.options.includes(t) ? t : ''
    } else if (q.type === 'date') {
      const t = str(v, 10); out = /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ''
    } else if (q.type === 'time') {
      const t = str(v, 5); out = /^\d{2}:\d{2}$/.test(t) ? t : ''
    } else {
      out = String(v ?? '').trim().slice(0, q.type === 'long' ? 3000 : 300)
    }
    const empty = Array.isArray(out) ? out.length === 0 : !out
    if (empty) { if (q.required) missing.push(q.id); continue }
    answers[q.id] = out
  }
  return { answers, missing }
}

const shortDate = (iso: string) => { const d = new Date(`${iso}T00:00:00`); return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }

/**
 * The parts of a submitted form that belong on the attendee row as well, so the
 * attendee list, the camp pack and the countdown emails see them without anyone
 * retyping: emergency contact, medical note, photo consent, room, arrival, goal.
 * Found by each question's `key`, so a coach rewording a question changes nothing.
 */
export function attendeePatch(form: InfoForm, answers: Answers, current: Record<string, unknown>): Record<string, unknown> {
  const keyed = (from: Answers) => {
    const out: Record<string, string> = {}
    for (const s of form.sections) for (const q of s.questions) {
      const a = from[q.id]
      if (q.key && a && !Array.isArray(a)) out[q.key] = a
    }
    return out
  }
  const byKey = keyed(answers)
  const patch: Record<string, unknown> = {}
  const ec = [byKey.ec_name, byKey.ec_relation ? `(${byKey.ec_relation})` : '', byKey.ec_phone].filter(Boolean).join(' ')
  if (ec) patch.emergency_contact = ec.slice(0, 160)
  const none = (v?: string) => !v || /^(none|no|n\/a|na|nil|nothing|-)\.?$/i.test(v.trim())
  const medOf = (k: Record<string, string>) => [none(k.medical) ? '' : k.medical, none(k.dietary) ? '' : `Dietary: ${k.dietary}`, none(k.injury) ? '' : `Injury: ${k.injury}`].filter(Boolean).join(' · ').slice(0, 500)
  const med = medOf(byKey)
  if (med) { patch.medical_notes = med; patch.consent_medical = true }
  else {
    // Corrected to "none". The note is cleared only when it is the one this
    // form put there last time — a note the coach wrote, or one from the
    // sign-up page, is not the form's to remove.
    const was = current.form_answers && typeof current.form_answers === 'object' ? medOf(keyed(current.form_answers as Answers)) : ''
    if (was && String(current.medical_notes ?? '') === was) patch.medical_notes = null
  }
  if (byKey.photo) patch.consent_photo = /^yes/i.test(byKey.photo)
  if (byKey.phone && !current.parent_phone) patch.parent_phone = byKey.phone.slice(0, 40)
  if (byKey.room) patch.room = [byKey.room, byKey.room_share ? `with ${byKey.room_share}` : ''].filter(Boolean).join(' · ').slice(0, 160)
  const arrival = [byKey.out_flight, byKey.out_date ? shortDate(byKey.out_date) : '', byKey.out_time].filter(Boolean).join(' · ')
  if (arrival) patch.arrival = arrival.slice(0, 120)
  // A goal the coach has already written for this player is not overwritten.
  if (byKey.goal && !String(current.camp_goal ?? '').trim()) patch.camp_goal = byKey.goal.slice(0, 300)
  return patch
}

export const formUrl = (origin: string, token: string) => `${origin.replace(/\/+$/, '')}/camp/form/${token}`

const escHtml = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
/** The block every camp email uses to ask for the form. Inline styles only — it lives in inboxes. */
export function formEmailBlock(url: string, o: { toParent: boolean; playerName?: string | null }): string {
  const first = String(o.playerName || '').trim().split(/\s+/)[0]
  const line = o.toParent
    ? `One thing before the camp: please take five minutes to fill in ${first ? escHtml(first) + '’s' : 'the'} player information — who to ring, anything medical, and what they want from the week.`
    : 'One thing before the camp: please take five minutes to fill in your player information — who to ring, anything medical, and what you want from the week.'
  return `<div style="margin:18px 0;padding:14px 16px;background:#f7f9fc;border:1px solid #e6ebf3;border-radius:11px">
  <div style="font-size:14px;line-height:1.55;color:#374151;margin-bottom:10px">${line}</div>
  <a href="${escHtml(url)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:14.5px;padding:11px 18px;border-radius:9px">Fill in the player information</a>
</div>`
}
