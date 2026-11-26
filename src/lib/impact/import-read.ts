// ─── LUMIO IMPACT — FROM TABS TO RECORDS ─────────────────────────────────────
// The pure steps of reading a workbook, shared by the Import card and the tests:
//   splitTabs     template tabs (mapped here, no AI) vs the rest (the AI maps them)
//   applyPlans    every row of every mapped tab as records; tabs that gave nothing
//                 are returned for the AI to read piece by piece

import type { SheetData } from '@/lib/import-engine/read-workbook'
import { applyPlan, type SheetPlan } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_SCHEMA, type ImpactImportCategory } from './import-schema'
import { readTemplateSheet } from './import-template'
import type { Found } from './import-tidy'

export const TEMPLATE_REASON = 'Lumio import template'

export function splitTabs(raw: SheetData[]) {
  const plans: SheetPlan<ImpactImportCategory>[] = []
  const sheets: SheetData[] = []
  const forAi: SheetData[] = []
  for (const s of raw) {
    if (/^read ?me$/i.test(s.name)) continue
    const t = readTemplateSheet(s)
    if (t) { plans.push(t.plan); sheets.push(t.sheet) } else { forAi.push(s); sheets.push(s) }
  }
  const rows = sheets.reduce((x, s) => x + Math.max(0, s.rows.length - 1), 0)
  return { plans, sheets, forAi, rows }
}

export function applyPlans(sheets: SheetData[], plans: SheetPlan<ImpactImportCategory>[], into: Found, skipped: string[]): SheetData[] {
  const leftover: SheetData[] = []
  for (const s of sheets) {
    const mine = plans.filter(p => p.sheet === s.name)
    let got = 0
    for (const p of mine) {
      if (p.category === 'skip') { got = -1; continue }
      if (p.irregular) continue
      const recs = applyPlan(IMPACT_IMPORT_SCHEMA, p, s.rows, s.banners, skipped)
      into[p.category].push(...recs)
      got += recs.length
    }
    // An empty template tab is simply empty; anything else that gave nothing is read by the AI.
    if (got === 0 && mine.length && !mine.some(p => p.reason === TEMPLATE_REASON)) leftover.push(s)
  }
  return leftover
}
