import { NextRequest, NextResponse } from 'next/server'
import { cleanRecord, foldText } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_SCHEMA, IMPACT_IMPORT_CATEGORIES, type ImpactImportCategory } from '@/lib/impact/import-schema'
import { impactHq } from '@/lib/impact/import-auth'

export const runtime = 'nodejs'

// Lumio Impact bulk import — save step. Writes ONLY Impact's own tables
// (tp_schools, tp_programmes) and does it as the signed-in HQ, not the service
// role: every insert carries hq_id = the user and is checked by the tp_* RLS
// policies (hq_id = auth.uid()), so an import can only land in that org.
// Every record is cleaned again here, and anything the org already has is
// left alone (schools by name; programmes by school + term).

const MAX_ROWS = 1000

export async function POST(req: NextRequest) {
  const hq = await impactHq()
  if (hq instanceof NextResponse) return hq
  const { user, db } = hq
  const body = await req.json().catch(() => ({})) as { category?: string; rows?: Record<string, unknown>[] }
  const category = body.category as ImpactImportCategory
  if (!IMPACT_IMPORT_CATEGORIES.includes(category)) return NextResponse.json({ error: 'Unknown category' }, { status: 400 })
  const rows = (Array.isArray(body.rows) ? body.rows : []).slice(0, MAX_ROWS)
  const clean = rows.map(r => cleanRecord(IMPACT_IMPORT_SCHEMA, category, r)).filter((r): r is Record<string, unknown> => !!r)

  const { data: schools, error: readErr } = await db.from('tp_schools').select('id, name')
  if (readErr) return NextResponse.json({ error: 'Could not check what you already have — nothing was saved.' }, { status: 500 })
  const schoolByName = new Map((schools ?? []).map(s => [foldText(s.name), s.id as string]))

  if (category === 'schools') {
    const fresh = clean.filter(r => !schoolByName.has(foldText(r.name)))
    const toSave = fresh.map(r => ({
      hq_id: user.id,
      name: String(r.name).slice(0, 200),
      borough: r.borough ?? null, address: r.address ?? null, head_name: r.head_name ?? null,
      pe_lead_name: r.pe_lead_name ?? null, safeguarding_lead: r.safeguarding_lead ?? null,
      contact_email: r.contact_email ?? null, contact_phone: r.contact_phone ?? null,
      funding_source: r.funding_source ?? null, status: (r.status as string) ?? 'enquiry', notes: r.notes ?? null,
    }))
    if (toSave.length) {
      const { error } = await db.from('tp_schools').insert(toSave)
      if (error) return NextResponse.json({ error: `Could not save schools: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ inserted: toSave.length, already: clean.length - fresh.length, leftOut: rows.length - clean.length })
  }

  // programmes — each must belong to a school the org has (saved first).
  const { data: progs } = await db.from('tp_programmes').select('school_id, term_label')
  const have = new Set((progs ?? []).map(p => `${p.school_id}|${foldText(p.term_label)}`))
  const noSchool: string[] = []
  const toSave: Record<string, unknown>[] = []
  let already = 0
  for (const r of clean) {
    const schoolId = schoolByName.get(foldText(r.school_name))
    if (!schoolId) { noSchool.push(String(r.school_name)); continue }
    const term = String(r.term_label ?? 'Programme').slice(0, 120)
    const key = `${schoolId}|${foldText(term)}`
    if (have.has(key)) { already++; continue }
    have.add(key)
    toSave.push({
      hq_id: user.id, school_id: schoolId, term_label: term,
      start_date: r.start_date ?? null, end_date: r.end_date ?? null, year_groups: r.year_groups ?? null,
      current_week: typeof r.current_week === 'number' ? r.current_week : 0,
      status: (r.status as string) ?? 'planned',
      cost_pence: typeof r.cost === 'number' ? Math.round(r.cost * 100) : null,
      notes: r.notes ?? null,
    })
  }
  if (toSave.length) {
    const { error } = await db.from('tp_programmes').insert(toSave)
    if (error) return NextResponse.json({ error: `Could not save programmes: ${error.message}` }, { status: 500 })
  }
  return NextResponse.json({ inserted: toSave.length, already, leftOut: rows.length - clean.length, noSchool: [...new Set(noSchool)].slice(0, 20) })
}
