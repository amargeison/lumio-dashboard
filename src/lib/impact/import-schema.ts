// ─── LUMIO IMPACT — IMPORT SCHEMA ────────────────────────────────────────────
// Impact's own record types for the product-agnostic import engine
// (src/lib/import-engine). Each category maps to an Impact-owned tp_* table:
//   schools    → tp_schools
//   programmes → tp_programmes (linked to its school by name)
// Venues, coaches, volunteers and families live in tables Impact doesn't own
// yet, so they're not importable here — that keeps Impact shippable without
// Coach (and vice versa).

import type { ImportSchema } from '@/lib/import-engine/records'

export type ImpactImportCategory = 'schools' | 'programmes'

export const IMPACT_IMPORT_FIELDS: Record<ImpactImportCategory, string[]> = {
  schools: ['name', 'borough', 'address', 'head_name', 'pe_lead_name', 'safeguarding_lead', 'contact_email', 'contact_phone', 'funding_source', 'status', 'notes'],
  programmes: ['school_name', 'term_label', 'start_date', 'end_date', 'year_groups', 'current_week', 'status', 'cost', 'notes'],
}

export const IMPACT_IMPORT_CATEGORIES = Object.keys(IMPACT_IMPORT_FIELDS) as ImpactImportCategory[]

export const IMPACT_ENUMS: Record<string, string[]> = {
  'schools.status': ['enquiry', 'fundraising', 'confirmed', 'running', 'complete', 'renewal'],
  'programmes.status': ['planned', 'fundraising', 'confirmed', 'running', 'complete'],
}

export const IMPACT_CATEGORY_LABEL: Record<ImpactImportCategory, string> = { schools: 'Schools', programmes: 'Programmes' }

export const IMPACT_IMPORT_SCHEMA: ImportSchema<ImpactImportCategory> = {
  categories: IMPACT_IMPORT_CATEGORIES,
  fields: IMPACT_IMPORT_FIELDS,
  labelField: { schools: 'name', programmes: 'school_name' },
  intFields: new Set(['programmes.current_week']),
  numFields: new Set(['programmes.cost']),
  dateFields: new Set(['programmes.start_date', 'programmes.end_date']),
  enums: IMPACT_ENUMS,
  synonyms: {
    'schools.status': { interested: 'enquiry', enquiry: 'enquiry', lead: 'enquiry', prospect: 'enquiry', fundraising: 'fundraising', unfunded: 'fundraising', confirmed: 'confirmed', booked: 'confirmed', running: 'running', active: 'running', live: 'running', complete: 'complete', completed: 'complete', finished: 'complete', renewal: 'renewal', renewing: 'renewal' },
    'programmes.status': { planned: 'planned', proposed: 'planned', fundraising: 'fundraising', confirmed: 'confirmed', booked: 'confirmed', running: 'running', active: 'running', live: 'running', 'in progress': 'running', complete: 'complete', completed: 'complete', finished: 'complete' },
  },
  fieldLabels: { status: 'Status', current_week: 'Week', cost: 'Cost', start_date: 'Start', end_date: 'End' },
  headingExact: /^(total|totals|sub-?total|grand total|name|school|school name|programme)$/i,
  headingPrefix: /^(total|totals|sub-?total|grand total|average|avg)\b/i,
  headingWhy: /^(total|totals|sub-?total|grand total|average|avg|name|school|school name|programme)\b/i,
  // A week number is 0–10 on a 10-week programme.
  parseField: (category, field, v) => {
    if (category !== 'programmes' || field !== 'current_week') return undefined
    const m = String(v).match(/(\d{1,2})/)
    const n = m ? Number(m[1]) : NaN
    return Number.isFinite(n) && n >= 0 && n <= 10 ? { value: n } : { spill: true }
  },
  // A school's programme is one per term.
  dedupeKey: (category, r, norm) => category === 'programmes' ? `${norm(r.school_name)}|${norm(r.term_label)}` : undefined,
}

/** What the model is told each category IS (shared by the map and read routes). */
export const IMPACT_MEANINGS = `What each category means:
- schools: primary or secondary schools the organisation works with (partners, prospects, past programmes). One per school.
- programmes: a block of sessions run at a school in a term (e.g. a 10-week programme) — one per school per term. school_name is the school it runs at.
- skip: anything else — timetables, registers of individual children, budgets, contact lists of non-schools, dashboards, instructions.`
