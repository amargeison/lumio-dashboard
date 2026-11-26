// ─── LUMIO IMPACT — IMPORT TIDY-UP ───────────────────────────────────────────
// Impact-specific steps between "rows read" and "de-duplicated", kept out of
// the product-agnostic engine:
//   • a row naming two children ("Jack & Mia Okafor (twins)") becomes two
//     children who share a family — flagged so the user can check the split;
//   • a mixed contacts list is routed by its tags into families, volunteers
//     and coaches ("parent;volunteer" is both), and an "unsubscribed" tag is
//     carried so an import never re-opts anyone in;
//   • each child's guardian details become a household (merged later with the
//     contacts list by email, then phone, then name);
//   • a Community row (a family at the weekend sessions, no school) becomes a
//     family, a child with no school and — with a first visit date — a weekend
//     register entry at that venue. Until the venue can be stored on the family
//     (migration 237), the preferred venue is kept in the family's notes.

import { cleanRecord, dedupeRecords, type Rec } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_SCHEMA, IMPACT_SAVE_ORDER, type ImpactImportCategory } from './import-schema'

export type Found = Record<ImpactImportCategory, Rec[]>
export const emptyFound = (): Found => Object.fromEntries(
  ['schools', 'programmes', 'venues', 'coaches', 'volunteers', 'families', 'children', 'registers', 'events', 'donations', 'responses', 'cpd', 'contacts', 'community'].map(c => [c, []]),
) as unknown as Found

const issue = (r: Rec, msg: string) => { r._review = [...((r._review as string[] | undefined) ?? []), msg] }

/** "Jack & Mia Okafor (twins)" / "Amy and Ben Lee" → two children, same details. */
export function splitChildren(recs: Rec[]): Rec[] {
  const out: Rec[] = []
  for (const r of recs) {
    const raw = String(r.name ?? '')
    const bare = raw.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
    const m = bare.match(/^([\p{L}'’-]+)\s*(?:&|\+|\band\b)\s*([\p{L}'’-]+)\s+([\p{L}'’ -]+)$/u)
    if (!m) { out.push(r); continue }
    for (const first of [m[1], m[2]]) {
      const child: Rec = { ...r, name: `${first} ${m[3]}`.trim(), notes: [r.notes, `Imported from one row: “${raw}”`].filter(Boolean).join(' · ') }
      child._review = [...((r._review as string[] | undefined) ?? [])]
      issue(child, `Split from one row (“${raw}”) into two children — check names and the fee`)
      out.push(child)
    }
  }
  return out
}

/** A contacts list → families / volunteers / coaches, by its tags. */
export function routeContacts(contacts: Rec[]): Pick<Found, 'families' | 'volunteers' | 'coaches'> {
  const families: Rec[] = [], volunteers: Rec[] = [], coaches: Rec[] = []
  for (const c of contacts) {
    const tags = String(c.tags ?? '').toLowerCase()
    const unsub = /unsubscri|opt(ed)?[ -]?out|do not (contact|email)|no marketing/.test(tags)
    const isCoach = /\bcoach|instructor|staff\b/.test(tags) || /^coach\b/i.test(String(c.name ?? ''))
    const isVol = /volunteer|helper|tenor|captain|session help/.test(tags)
    const isParent = /parent|guardian|mum|dad|carer|family/.test(tags) || (!isCoach && !isVol)
    const notes = [c.notes, tags && `Tags: ${c.tags}`].filter(Boolean).join(' · ') || undefined
    // Values the contacts reader couldn't read carry across as review flags —
    // onto the records made from THIS contact only.
    const carry = (r: Rec) => { for (const m of (c._review as string[] | undefined) ?? []) if (!/^Only a first name/.test(m)) issue(r, m) }
    if (isCoach) {
      const name = String(c.name ?? '').replace(/^coach\s+/i, '').trim()
      const coach = cleanRecord(IMPACT_IMPORT_SCHEMA, 'coaches', { name, email: c.email, phone: c.phone, notes })
      if (coach) { carry(coach); coaches.push(coach) }
    }
    if (isVol) {
      const vol = cleanRecord(IMPACT_IMPORT_SCHEMA, 'volunteers', { name: c.name, email: c.email, phone: c.phone, notes })
      if (vol) { carry(vol); volunteers.push(vol) }
    }
    if (isParent) {
      const fam = cleanRecord(IMPACT_IMPORT_SCHEMA, 'families', { guardian_name: c.name, email: c.email, phone: c.phone, notes, unsubscribed: unsub ? 'yes' : undefined })
      if (fam) {
        carry(fam)
        if (unsub) issue(fam, 'Marked unsubscribed in the source — kept opted out of comms')
        families.push(fam)
      }
    }
  }
  return { families, volunteers, coaches }
}

const yesNo = (v: unknown) => (v === true ? 'yes' : v === false ? 'no' : undefined)

/** Community rows → families, children with no school, and first-visit register entries. */
export function communityRecords(rows: Rec[]): Pick<Found, 'families' | 'children' | 'registers'> {
  const families: Rec[] = [], children: Rec[] = [], registers: Rec[] = []
  for (const r of rows) {
    const carry = (rec: Rec) => { for (const m of (r._review as string[] | undefined) ?? []) issue(rec, m) }
    const venue = typeof r.venue_name === 'string' ? r.venue_name : undefined
    const child = cleanRecord(IMPACT_IMPORT_SCHEMA, 'children', {
      name: r.child_name, date_of_birth: r.date_of_birth, guardian_name: r.guardian_name, guardian_email: r.email, guardian_phone: r.phone,
      photo_consent: yesNo(r.consent_photo), notes: [r.notes, 'Community (weekend sessions)'].filter(Boolean).join(' · '),
    })
    if (!child) continue
    // The child's own checks (e.g. photo consent) plus the row's.
    carry(child)
    if (child._review) child._review = [...new Set(child._review as string[])]
    children.push(child)
    if (r.guardian_name || r.email || r.phone) {
      const fam = cleanRecord(IMPACT_IMPORT_SCHEMA, 'families', {
        guardian_name: r.guardian_name ?? `Parent/carer of ${child.name}`, email: r.email, phone: r.phone,
        consent_data: yesNo(r.consent_data), consent_photo: yesNo(r.consent_photo), notes: venue ? `Weekend venue: ${venue}` : undefined,
      })
      if (fam) families.push(fam)
    }
    if (r.first_visit) {
      const reg = cleanRecord(IMPACT_IMPORT_SCHEMA, 'registers', {
        child_name: child.name, child_date_of_birth: child.date_of_birth, session_date: r.first_visit, present: 'yes', kind: 'weekend', venue_name: venue,
      })
      if (reg) registers.push(reg)
    }
  }
  return { families, children, registers }
}

/** Each child's guardian details as a household record. */
export function familiesFromChildren(children: Rec[]): Rec[] {
  const out: Rec[] = []
  for (const ch of children) {
    if (!ch.guardian_name && !ch.guardian_email && !ch.guardian_phone) continue
    const rel = typeof ch.guardian_name === 'string' && /^(mum|mom|mummy|dad|daddy|mother|father|gran|grandma|grandad|nan|nanna|carer)$|['’]s (mum|dad|mother|father)$/i.test(ch.guardian_name)
    const name = !ch.guardian_name || rel ? `Parent/carer of ${ch.name}` : ch.guardian_name
    const fam = cleanRecord(IMPACT_IMPORT_SCHEMA, 'families', { guardian_name: name, email: ch.guardian_email, phone: ch.guardian_phone })
    if (!fam) continue
    if (rel || !ch.guardian_name) issue(fam, `No guardian name for ${ch.name} (“${ch.guardian_name ?? 'blank'}”) — add one`)
    out.push(fam)
  }
  return out
}

/** Everything read → tidy, routed, de-duplicated categories ready to review. */
export function finalise(found: Found): Found {
  const f = { ...found }
  f.children = splitChildren(f.children)
  const routed = routeContacts(f.contacts)
  const community = communityRecords(f.community ?? [])
  // Community children already have their household (with consents), so they don't
  // make a second one from their guardian columns.
  f.families = [...f.families, ...routed.families, ...community.families, ...familiesFromChildren(f.children)]
  f.children = [...f.children, ...community.children]
  f.registers = [...f.registers, ...community.registers]
  f.volunteers = [...f.volunteers, ...routed.volunteers]
  f.coaches = [...f.coaches, ...routed.coaches]
  f.contacts = []
  f.community = []
  for (const c of IMPACT_SAVE_ORDER) f[c] = dedupeRecords(IMPACT_IMPORT_SCHEMA, c, f[c])
  // A volunteer who is also a parent: one person, two roles — keep both.
  return f
}
