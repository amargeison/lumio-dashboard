// ─── LUMIO IMPACT — IMPORT TEMPLATE (no-AI fast path) ───────────────────────
// A downloadable workbook with one tab per record type and fixed headings,
// built from the import schema itself so it can never drift from what the
// importer accepts. When an uploaded tab's headings all match a template tab,
// it is mapped deterministically — no AI call, no AI cost. Only messy or
// unstructured files go to the AI.

import type { SheetData } from '@/lib/import-engine/read-workbook'
import type { SheetPlan } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_FIELDS, IMPACT_SAVE_ORDER, IMPACT_CATEGORY_LABEL, IMPACT_ENUMS, type ImpactImportCategory } from './import-schema'

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')

/** "date_of_birth" → "Date of birth" — the template's heading for a field. */
export const headingFor = (field: string) => field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')

const HINTS: Record<string, string> = {
  date: 'Dates as YYYY-MM-DD or DD/MM/YYYY',
  yesno: 'Yes / No',
}
const YESNO = new Set(['inclusive', 'inducted', 'consent_data', 'consent_photo', 'unsubscribed', 'photo_consent', 'send', 'present', 'gift_aid', 'would_recommend', 'consent_publish'])

/** A tab that is exactly a template tab → its plan; anything else → null (AI maps it). */
export function templatePlan(sheet: SheetData): SheetPlan<ImpactImportCategory> | null {
  const cat = IMPACT_SAVE_ORDER.find(c => norm(c) === norm(sheet.name) || norm(IMPACT_CATEGORY_LABEL[c]) === norm(sheet.name))
  if (!cat) return null
  const header = sheet.rows[0] ?? []
  const fields = IMPACT_IMPORT_FIELDS[cat]
  const columns: Record<string, number> = {}
  for (let i = 0; i < header.length; i++) {
    if (!String(header[i] ?? '').trim()) continue
    const f = fields.find(x => norm(x) === norm(header[i]) || norm(headingFor(x)) === norm(header[i]))
    if (!f) return null          // an unknown heading — not a template tab
    columns[f] = i
  }
  if (!Object.keys(columns).length) return null
  return { sheet: sheet.name, category: cat, header_row: 0, columns, confidence: 'high', reason: 'Lumio import template' }
}

/** Builds and downloads the template workbook (browser only). */
export async function downloadTemplate() {
  const mod = await import('xlsx')
  const XLSX = (mod.utils ? mod : (mod as unknown as { default: typeof mod }).default)
  const wb = XLSX.utils.book_new()
  const readme = [
    ['Lumio Impact — import template'],
    [''],
    ['Fill in any tabs you have data for and delete or leave empty the rest. Keep the headings exactly as they are —'],
    ['a tab that matches this template is imported directly (no AI needed). Upload the file in Settings → Import data.'],
    [''],
    ['Tab', 'Headings', 'Allowed values / format'],
    ...IMPACT_SAVE_ORDER.map(c => {
      const notes = IMPACT_IMPORT_FIELDS[c].map(f => {
        const allowed = IMPACT_ENUMS[`${c}.${f}`]
        if (allowed) return `${headingFor(f)}: ${allowed.join(' / ')}`
        if (YESNO.has(f)) return `${headingFor(f)}: ${HINTS.yesno}`
        if (/date|_on$|expiry|since/.test(f)) return `${headingFor(f)}: ${HINTS.date}`
        return ''
      }).filter(Boolean).join(' · ')
      return [IMPACT_CATEGORY_LABEL[c], IMPACT_IMPORT_FIELDS[c].map(headingFor).join(', '), notes]
    }),
    [''],
    ['Children: one row per child. Families are created from the guardian columns and matched by email, then phone.'],
    ['Programmes and children link to schools by the school name; registers link to children by name.'],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(readme), 'Read me')
  for (const c of IMPACT_SAVE_ORDER) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([IMPACT_IMPORT_FIELDS[c].map(headingFor)]), IMPACT_CATEGORY_LABEL[c].slice(0, 31))
  }
  XLSX.writeFile(wb, 'lumio-impact-import-template.xlsx')
}
