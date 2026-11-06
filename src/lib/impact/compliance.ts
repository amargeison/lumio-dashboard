// One compliance rule for the live portal: the Overview tile, Needs attention,
// and the Coaches and Volunteers pages all read it, so they can't disagree.
//
//   expired       date in the past
//   expiring      within EXPIRY_WINDOW_DAYS
//   ok            nothing to do
//   not recorded  no date: shown, but never counted
//
// Safeguarding is a completion date, not an expiry, and no renewal period has
// been set. So a recorded date is ok however old it is. Reading it as an expiry
// would call every trained person expired.

export type CertState = 'expired' | 'expiring' | 'ok' | 'not recorded'
export type CertName = 'DBS' | 'First aid' | 'Safeguarding'
export interface Certificate { name: CertName; date: string | null; state: CertState }
export interface CompliancePerson { id: string; name: string; role: string; kind: 'coach' | 'volunteer'; certificates: Certificate[] }
export interface ComplianceItem { id: string; text: string; kind: 'warn' | 'info'; target: { tab: string } }

export const EXPIRY_WINDOW_DAYS = 60
const DAY_MS = 86400000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']

/** Today as YYYY-MM-DD in the viewer's own timezone. */
export const isoToday = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

export function expiryState(date: string | null | undefined, today: string): CertState {
  if (!date) return 'not recorded'
  if (date < today) return 'expired'
  return (Date.parse(date) - Date.parse(today)) / DAY_MS < EXPIRY_WINDOW_DAYS ? 'expiring' : 'ok'
}

// A DBS status set by hand still counts when there's no date to check it against.
export function dbsCertificate(status: string, expiry: string | null | undefined, today: string): Certificate {
  const state = expiry ? expiryState(expiry, today) : status === 'expired' ? 'expired' : status === 'due-soon' ? 'expiring' : 'not recorded'
  return { name: 'DBS', date: expiry ?? null, state }
}
const firstAid = (expiry: string | null | undefined, today: string): Certificate => ({ name: 'First aid', date: expiry ?? null, state: expiryState(expiry, today) })
const safeguarding = (completed: string | null | undefined): Certificate => ({ name: 'Safeguarding', date: completed ?? null, state: completed ? 'ok' : 'not recorded' })

export const staffCertificates = (s: { dbs_status: string; dbs_expiry?: string | null; first_aid_expiry?: string | null; safeguarding_date?: string | null }, today: string): Certificate[] =>
  [dbsCertificate(s.dbs_status, s.dbs_expiry, today), firstAid(s.first_aid_expiry, today), safeguarding(s.safeguarding_date)]

// A volunteer's induction is their safeguarding training.
export const volunteerCertificates = (v: { dbs_status: string; dbs_expiry?: string | null; first_aid_expiry?: string | null; induction_date?: string | null }, today: string): Certificate[] => [
  ...(v.dbs_status === 'n/a' && !v.dbs_expiry ? [] : [dbsCertificate(v.dbs_status, v.dbs_expiry, today)]),
  firstAid(v.first_aid_expiry, today),
  safeguarding(v.induction_date),
]

export const roleLabel = (r: string) => r === 'lead' ? 'Lead' as const : r === 'assistant' ? 'Assistant' as const : r === 'apprentice' ? 'Apprentice' as const : 'Coach' as const

type StaffRow = Parameters<typeof staffCertificates>[0] & { id: string; name: string; role: string }
type VolunteerRow = Parameters<typeof volunteerCertificates>[0] & { id: string; name: string }

/** Everyone the rule covers, coaches first. */
export const compliancePeople = (rows: { staff?: StaffRow[]; volunteers?: VolunteerRow[] }, today: string): CompliancePerson[] => [
  ...(rows.staff ?? []).map(s => ({ id: s.id, name: s.name, role: roleLabel(s.role), kind: 'coach' as const, certificates: staffCertificates(s, today) })),
  ...(rows.volunteers ?? []).map(v => ({ id: v.id, name: v.name, role: 'Volunteer', kind: 'volunteer' as const, certificates: volunteerCertificates(v, today) })),
]

export const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** The state in words: "First aid expired 30 Sept 2026", "DBS expires 1 Dec 2026". */
export function certText(c: Certificate): string {
  if (c.state === 'not recorded') return `${c.name} not recorded`
  if (c.state === 'ok') return c.date ? `${c.name} ${longDate(c.date)}` : c.name
  if (!c.date) return `${c.name} ${c.state === 'expired' ? 'expired' : 'due soon'}`
  return `${c.name} ${c.state === 'expired' ? 'expired' : 'expires'} ${longDate(c.date)}`
}

export const needsAction = (c: Certificate) => c.state === 'expired' || c.state === 'expiring'

/** Everything to act on: expired first, then the oldest or soonest date. */
export function complianceItems(people: CompliancePerson[]): ComplianceItem[] {
  return people
    .flatMap(p => p.certificates.filter(needsAction).map(c => ({ p, c })))
    .sort((a, b) => Number(b.c.state === 'expired') - Number(a.c.state === 'expired') || (a.c.date ?? '').localeCompare(b.c.date ?? ''))
    .map(({ p, c }) => ({
      id: `${p.id}-${c.name}`,
      text: `${p.name} · ${p.role} · ${certText(c)}`,
      kind: c.state === 'expired' ? 'warn' : 'info',
      target: { tab: p.kind === 'coach' ? 'coaches' : 'tenors' },
    }))
}

/** certText without the name, for a row that already shows it: "expires 1 Dec 2026". */
export const certNote = (c: Certificate) => certText(c).slice(c.name.length + 1) || 'Recorded'
