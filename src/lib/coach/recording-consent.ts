// Consent to lessons being recorded (pure — no database, no browser).
//
// A lesson recording is personal data about the client — their voice, and on
// video their image — and it is sent to services in the US to be turned into
// text and a summary. So it is only made with the client's (or, for a child,
// their parent's) agreement: given on their welcome link, or noted by the coach
// when they agree in person. Without it, recording for that client is stopped.

export type RecordConsent = { consent_record?: boolean | null; consent_record_at?: string | null; consent_record_by?: string | null; consent_record_how?: string | null }

/** What the client is asked, in the words they read. */
export function recordQuestion(o: { coach: string; childFirst: string | null }): { ask: string; explain: string } {
  return {
    ask: o.childFirst ? `Can ${o.coach} record ${o.childFirst}’s lessons?` : `Can ${o.coach} record your lessons?`,
    explain: `Now and then ${o.coach} records a lesson (sound, sometimes video) to write up the lesson summary. Recordings are stored privately in the UK and turned into text and a summary by services in the United States, under UK data safeguards. They are never shared or used for anything else, and you can change your mind at any time.`,
  }
}

export const hasRecordConsent = (p: RecordConsent | null | undefined) => !!p?.consent_record

/** For the coach: "Agreed by Jo Smith on their welcome link, 12 Oct" */
export function consentWords(p: RecordConsent, first: string): string {
  const when = p.consent_record_at ? new Date(p.consent_record_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' }) : ''
  if (p.consent_record && p.consent_record_how === 'in_person') return `Agreed in person (noted by you)${when ? `, ${when}` : ''}.`
  if (p.consent_record) return `Agreed${p.consent_record_by ? ` by ${p.consent_record_by}` : ''}${p.consent_record_how === 'welcome' ? ' on their welcome link' : ''}${when ? `, ${when}` : ''}.`
  if (p.consent_record_how === 'withdrawn' || p.consent_record_how === 'declined') return `${first} said no${when ? ` (${when})` : ''}. Their lessons cannot be recorded.`
  return `Not asked yet. ${first}’s lessons cannot be recorded until they agree.`
}

export const RECORDING_NEEDS_CONSENT = (name: string) =>
  `${name} has not agreed to lessons being recorded. Ask them on their welcome link, or if they agreed in person, note it on their profile (Player Roster) first.`
