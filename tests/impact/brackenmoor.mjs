// The small Brackenmoor fixture (fictional, brand-universe data) as the importer sees it.
//   fixtureSheets()      the file as the browser reads it (its own headings: the AI path)
//   asTemplate(sheets)   the same data written into the Lumio template (the template path),
//                        column by column with the mapping spelled out below, so the
//                        template test doesn't depend on the AI
//   readRecords(sheets, plans)   what the Import card does next: template tabs mapped
//                        directly, other tabs by the plans given, then tidied
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const src = fileURLToPath(new URL('../../src/', import.meta.url))
registerHooks({
  resolve(spec, ctx, next) {
    const base = spec.startsWith('@/') ? src + spec.slice(2) : spec.startsWith('./') && ctx.parentURL?.includes('/src/') ? fileURLToPath(new URL(spec, ctx.parentURL)) : null
    if (base && !/\.tsx?$/.test(base) && existsSync(`${base}.ts`)) return next(pathToFileURL(`${base}.ts`).href, ctx)
    return base ? next(pathToFileURL(base).href, ctx) : next(spec, ctx)
  },
})

export const { readWorkbook } = await import('../../src/lib/import-engine/read-workbook.ts')
export const { templateSheets } = await import('../../src/lib/impact/import-template.ts')
export const { splitTabs, applyPlans } = await import('../../src/lib/impact/import-read.ts')
export const { emptyFound, finalise } = await import('../../src/lib/impact/import-tidy.ts')
export const plan = await import('../../src/lib/impact/import-plan.ts')
export const { IMPACT_IMPORT_FIELDS, IMPACT_SAVE_ORDER } = await import('../../src/lib/impact/import-schema.ts')
const XLSX = (await import('xlsx')).default

export const SMALL = fileURLToPath(new URL('../fixtures/Brackenmoor_import_test_small.xlsx', import.meta.url))
export const AI_PLANS = fileURLToPath(new URL('../fixtures/Brackenmoor_import_test_small.ai-plans.json', import.meta.url))

export const fileOf = (path, name = path.split('/').pop()) => new File([readFileSync(path)], name)
export const fixtureSheets = () => readWorkbook(fileOf(SMALL))

/** Rows of an array-of-arrays workbook as a File, read back exactly as the browser would. */
export async function workbookFile(tabs, name = 'import.xlsx') {
  const wb = XLSX.utils.book_new()
  for (const t of tabs) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(t.rows), t.name)
  return new File([XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })], name)
}

// fixture tab → template tab: template field ← fixture heading (or a function of the row).
// Sessions are not a template tab (the importer makes sessions from registers), and the
// template has no campaign tab (donations go to the org's campaign), so those two tabs
// have no template equivalent.
const MAP = {
  Schools: ['Schools', { name: 'School', address: 'Address', postcode: 'Postcode', head_name: 'Head / contact', contact_email: 'Contact email', contact_phone: 'Phone', status: 'Status' }],
  Programmes: ['Programmes', { term_label: 'Programme', school_name: 'School', start_date: 'Start date', end_date: 'End date', status: 'Status' }],
  Venues: ['Venues', { name: 'Venue', address: 'Address', postcode: 'Postcode', session_day: r => r.Session.split(' ')[0], session_time: r => r.Session.split(' ')[1] }],
  Coaches: ['Coaches', { name: 'Name', role: r => (/lead/i.test(r.Role) ? 'lead' : /assistant/i.test(r.Role) ? 'assistant' : 'coach'), email: 'Email', phone: 'Phone', dbs_expiry: 'DBS expiry', first_aid_expiry: 'First aid expiry', safeguarding_date: 'Safeguarding cert date' }],
  Families: ['Families', { guardian_name: 'Parent / guardian', email: 'Email', phone: 'Phone', consent_photo: 'Photo consent' }],
  Volunteers: ['Volunteers', { name: 'Name', email: 'Email', phone: 'Phone', venue_name: 'Venue' }],
  Children: ['Children', { name: r => `${r['First name']} ${r['Last name']}`, date_of_birth: 'Date of birth', year_group: 'Year group', school_name: 'School', programme_term: 'Programme / cohort',
    guardian_name: 'Parent / guardian', guardian_email: 'Parent email', guardian_phone: 'Parent phone', photo_consent: 'Photo consent', medical_notes: 'Medical / SEND notes' }],
  Registers: ['Register entries', { session_date: 'Session date', child_name: 'Child', school_name: 'School / venue', present: 'Attended' }],
  Donations: ['Donations', { donated_on: 'Date', donor_name: 'Donor', amount: 'Amount (£)', purpose: 'Campaign', gift_aid: 'Gift Aid' }],
}
const heading = f => (f === 'fsm' ? 'FSM' : f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' '))

/** The fixture's data written into the downloaded template (Notes and example rows kept, as Harry would leave them). */
export function asTemplate(sheets) {
  const tpl = templateSheets()
  return tpl.map(t => {
    const src = Object.entries(MAP).find(([, [to]]) => to === t.name)
    const sheet = src && sheets.find(s => s.name === src[0])
    if (!sheet) return t
    const [head, ...body] = sheet.rows
    const fields = t.rows[0].map(h => Object.keys(src[1][1]).find(f => heading(f) === h))
    const rows = body.map(cells => {
      const r = Object.fromEntries(head.map((h, i) => [h, cells[i] ?? '']))
      return fields.map(f => { const m = f && src[1][1][f]; return m ? String(typeof m === 'function' ? m(r) : r[m] ?? '') : '' })
    })
    return { name: t.name, rows: [...t.rows, ...rows] }
  })
}

/** What the card does once the tabs are read and the AI has given its plans (if any were needed). */
export function readRecords(sheets, aiPlans = []) {
  const { plans, sheets: tabs, forAi, rows } = splitTabs(sheets)
  const into = emptyFound()
  const skipped = []
  const leftover = applyPlans(tabs, [...plans, ...aiPlans], into, skipped)
  return { found: finalise(into), templateTabs: plans.length, forAi: forAi.map(s => s.name), leftover: leftover.map(s => s.name), rows, skipped }
}

/** The records the card sends to the plan route (review flags are recomputed there). */
export const payload = found => Object.fromEntries(IMPACT_SAVE_ORDER.map(c => [c, found[c].map(({ _review, ...r }) => r)]))

let seq = 0
export const ctx = (extra = {}) => ({ hqId: 'hq-a', userId: 'user-a', newId: () => `id-${++seq}`, now: '2026-11-26T10:00:00.000Z', today: '2026-11-26', ...extra })

/** The org's rows after a plan's inserts and updates were written (what the next import sees). */
export function existingAfter(p, before = plan.emptyExisting()) {
  const ex = structuredClone(before)
  const into = { tp_schools: 'schools', tp_programmes: 'programmes', tp_venues: 'venues', tp_staff: 'staff', tp_families: 'families', tp_volunteers: 'volunteers', tp_children: 'children',
    tp_fundraising_events: 'events', tp_donations: 'donations', tp_sessions: 'sessions', tp_attendance: 'attendance', tp_impact_responses: 'responses', tp_cpd: 'cpd',
    tp_pack_sizes: 'packSizes', tp_pack_payments: 'packPayments' }
  for (const op of p.ops) {
    if (op.kind === 'insert' && op.table === 'tp_fundraising_campaigns') ex.campaignId = op.row.id
    else if (op.kind === 'insert') ex[into[op.table]].push(structuredClone(op.row))
    else if (op.kind === 'issue') ex.packIssues.push({ child_id: op.childId, item_id: op.itemId })
    else if (op.kind === 'update') { const k = into[op.table]; const row = ex[k].find(r => r.id === op.id); Object.assign(row, op.patch) }
  }
  return ex
}
