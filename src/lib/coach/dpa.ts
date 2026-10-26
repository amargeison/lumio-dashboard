// Lumio's data processing agreement with each academy, and the privacy notice
// an academy gives its clients (pure — no database, no browser).
//
// The academy (the coach) is the CONTROLLER of their clients' personal data;
// Lumio is their PROCESSOR (UK GDPR Article 28). The agreement says what Lumio
// may do with the data and what it promises in return, and lists every other
// company ("sub-processor") that handles it — the coach needs that list for
// their own privacy notice.
//
// The words are versioned. When they change, the version changes and the
// academy is asked to accept again; each acceptance keeps the exact words.
//
// A starting point written in plain English, not legal advice: it should be
// read by a solicitor before Lumio relies on it.

export const DPA_VERSION = '2026-10'

/** Lumio's details. The company number and address are filled in once the company is registered. */
export const PROCESSOR = {
  name: 'Lumio Sports Ltd',
  number: 'to be added',
  address: 'to be added',
}

export type SubProcessor = { name: string; does: string; where: string; transfer?: string }

/** Every company that handles clients' personal data for Lumio. */
export const SUB_PROCESSORS: SubProcessor[] = [
  { name: 'Supabase', does: 'The database, file storage (including lesson recordings) and sign-in', where: 'United Kingdom (London)' },
  { name: 'Hetzner Online GmbH', does: 'The servers that run the Lumio app', where: 'European Union (Germany or Finland)' },
  { name: 'Stripe Payments UK Ltd', does: 'Card and Direct Debit payments into the academy’s own Stripe account. Card and bank details are held by Stripe, never by Lumio.', where: 'United Kingdom, EU and United States', transfer: 'UK International Data Transfer Addendum' },
  { name: 'Resend', does: 'Sending emails (when the coach has not connected their own mailbox)', where: 'United States', transfer: 'UK International Data Transfer Addendum' },
  { name: 'Groq, Inc.', does: 'Turning lesson recordings into text', where: 'United States', transfer: 'UK International Data Transfer Addendum' },
  { name: 'Anthropic, PBC', does: 'Writing lesson summaries, briefings and drafts from the coach’s notes and recordings', where: 'United States', transfer: 'UK International Data Transfer Addendum' },
]

/** Services that handle data only because the coach connects their own account. */
export const COACH_CONNECTED = 'If you connect your own Google, Microsoft or Apple (iCloud) calendar or mailbox, or Discord, Lumio sends bookings and messages to that account for you. Those companies process that data under your own agreement with them, not as Lumio’s sub-processors.'

export type Section = { title: string; paras: string[] }

/** The agreement in full, for one academy. */
export function dpaSections(academy: string): Section[] {
  const a = academy.trim() || 'the academy'
  return [
    { title: 'Who this is between', paras: [
      `This agreement is between ${a} (“you”, the controller) and ${PROCESSOR.name} (company number ${PROCESSOR.number}, registered address ${PROCESSOR.address}) (“Lumio”, the processor). It forms part of your terms of use of Lumio and applies whenever Lumio processes personal data for you.`,
    ] },
    { title: 'What Lumio does with the data', paras: [
      'Lumio processes personal data only to run your coaching portal: your clients’ records, bookings, lessons and lesson summaries, recordings, payments, messages and emails, camps and trips, and the reports in the portal.',
      'Lumio acts only on your documented instructions — which are this agreement and the way you use the portal — unless the law requires otherwise, in which case Lumio will tell you first unless the law forbids it. Lumio does not sell the data, use it to advertise, or use it to train AI models.',
    ] },
    { title: 'Whose data, and what kind', paras: [
      'People: your clients (adults and children), their parents or guardians and emergency contacts, enquirers (leads), your coaches and staff.',
      'Data: names, contact details, ages, coaching notes and progress, attendance, bookings and payments, messages, questionnaire answers, photos, and audio and video recordings of lessons. With the person’s explicit consent, health notes (special category data). Card and bank details are held by Stripe, not by Lumio.',
    ] },
    { title: 'How long', paras: [
      'For as long as you use Lumio. When you stop, Lumio deletes your data within 30 days, or returns a copy first if you ask, unless the law requires Lumio to keep it. You can delete a client, a recording or anything else yourself at any time from the portal.',
    ] },
    { title: 'Keeping it safe', paras: [
      'Everyone at Lumio who can see your data is bound to keep it confidential, and only looks at it when needed to run or fix the service, or when you ask for help.',
      'Lumio uses appropriate technical and organisational measures, including: encryption in transit (HTTPS) and at rest; each academy’s data kept separate from every other academy’s at the database level; coaches you invite seeing only their own players; recordings stored privately and opened only through short-lived links; and card details never touching Lumio.',
    ] },
    { title: 'Other companies Lumio uses', paras: [
      'You agree that Lumio may use the sub-processors listed below. Lumio holds each to data protection terms at least as protective as these, and is responsible to you for what they do.',
      'Lumio will tell you at least 14 days before adding or replacing a sub-processor, by email and in the portal, so you can object. If you object on reasonable grounds and we cannot resolve it, you may stop using the service and Lumio will delete your data.',
    ] },
    { title: 'Data leaving the UK', paras: [
      'Some sub-processors are outside the UK (see the list). Lumio only transfers data where UK law allows it: to a country the UK recognises as adequate, or under the UK International Data Transfer Addendum to the EU standard contractual clauses (or the UK–US data bridge where the recipient is certified).',
    ] },
    { title: 'Helping you', paras: [
      'Lumio will help you respond to people exercising their rights (to see, correct, export or delete their data); most of this you can do yourself in the portal.',
      'Lumio will tell you without undue delay, and within 48 hours of becoming aware, of any personal data breach affecting your data, with what it knows and what it is doing about it, and will help you with any report to the ICO or to the people affected.',
      'Lumio will give you the information you reasonably need to show you are meeting your obligations, including for a data protection impact assessment, and will answer reasonable questions about how the data is handled.',
    ] },
    { title: 'Your part', paras: [
      'You confirm you have a lawful basis for the data you put into Lumio, that you tell your clients how it is used (the privacy notice in the portal is a starting point), and that you have their consent where it is needed — for example to record lessons, to keep health notes, and for photos and video of children.',
    ] },
  ]
}

/** The agreement as one block of text: what is kept with an acceptance. */
export function dpaText(academy: string): string {
  const subs = SUB_PROCESSORS.map(s => `- ${s.name}: ${s.does}. ${s.where}.${s.transfer ? ` Transfer safeguard: ${s.transfer}.` : ''}`).join('\n')
  return `Data processing agreement — version ${DPA_VERSION}\n\n` +
    dpaSections(academy).map((s, i) => `${i + 1}. ${s.title}\n${s.paras.join('\n')}`).join('\n\n') +
    `\n\nSub-processors\n${subs}\n\n${COACH_CONNECTED}`
}

/** A privacy notice the academy can adapt and give to clients. */
export function privacyNotice(academy: string, coachEmail?: string | null): string {
  const a = academy.trim() || 'Our academy'
  return `PRIVACY NOTICE — ${a}

Who we are: ${a} is the controller of your personal data${coachEmail ? ` (contact: ${coachEmail})` : ''}.

What we collect: your (or your child’s) name, age and contact details, parent or guardian and emergency contacts, coaching notes and progress, attendance, bookings and payments, messages, and your answers to our welcome questions. With your consent: photos and video, recordings of lessons, and health notes.

Why: to coach you, run lessons, groups, camps and trips, keep you safe, take payments and keep in touch. Our lawful basis is our agreement with you, our legitimate interest in running the academy, and — for recordings, health notes and photos — your consent, which you can withdraw at any time.

Recordings: if you agree, we record some lessons (sound, sometimes video) to write up your lesson summary. Recordings are stored privately in the UK and turned into text and a summary by services in the United States, under UK data transfer safeguards. They are never used for anything else.

Who handles it: our coaching software, Lumio (${PROCESSOR.name}), processes the data for us under a data processing agreement. Lumio uses: ${SUB_PROCESSORS.map(s => `${s.name} (${s.where})`).join('; ')}. Card and bank details are held only by Stripe.

How long: while you train with us, then as long as the law requires (for example payment records), after which we delete it.

Your rights: you can ask to see, correct, export or delete your data, or withdraw a consent, at any time — just contact us. You can also complain to the Information Commissioner’s Office (ico.org.uk).`
}
