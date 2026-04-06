import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Levenshtein distance (iterative) ─────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_: unknown, i: number) =>
    Array.from({ length: n + 1 }, (_: unknown, j: number) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// ─── Name normalisation ───────────────────────────────────────────────────────
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|incorporated|llc|plc|fc|afc|rfc|cc)\b/gi, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function emailDomain(email: string): string {
  const parts = email.toLowerCase().split('@')
  return parts.length === 2 ? parts[1] : ''
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
interface ScoredDuplicate {
  id: string
  name: string
  email: string | null
  score: number
  confidence: 'certain' | 'likely' | 'possible'
  matchReasons: string[]
}

function scoreRecords(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>,
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  const inEmail = String(incoming.email || '').toLowerCase().trim()
  const exEmail = String(existing.email || '').toLowerCase().trim()

  // Exact email match → certain duplicate
  if (inEmail && exEmail && inEmail === exEmail) {
    return { score: 100, reasons: ['Exact email match'] }
  }

  // Email domain match
  if (inEmail && exEmail) {
    const inDomain = emailDomain(inEmail)
    const exDomain = emailDomain(exEmail)
    if (inDomain && exDomain && inDomain === exDomain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(inDomain)) {
      score += 30
      reasons.push(`Same email domain: ${inDomain}`)
    }
  }

  // Exact phone match
  const inPhone = String(incoming.phone || '').replace(/[^0-9+]/g, '')
  const exPhone = String(existing.phone || '').replace(/[^0-9+]/g, '')
  if (inPhone && exPhone && inPhone.length >= 7 && inPhone === exPhone) {
    score += 80
    reasons.push('Exact phone match')
  }

  // Name similarity
  const inName = normaliseName(String(incoming.name || incoming.company_name || ''))
  const exName = normaliseName(String(existing.name || existing.company_name || ''))
  if (inName && exName) {
    if (inName === exName) {
      score += 70
      reasons.push('Exact name match')
    } else {
      const dist = levenshtein(inName, exName)
      if (dist <= 2) {
        score += 40
        reasons.push(`Name very similar (distance: ${dist})`)
      } else {
        const inFirst = inName.split(' ')[0]
        const exFirst = exName.split(' ')[0]
        if (inFirst && exFirst && inFirst === exFirst && inFirst.length >= 3) {
          score += 20
          reasons.push(`First word match: "${inFirst}"`)
        }
      }
    }
  }

  // Company name match (for contacts)
  const inCompany = normaliseName(String(incoming.company_name || ''))
  const exCompany = normaliseName(String(existing.company_name || ''))
  if (inCompany && exCompany && inCompany === exCompany && inCompany !== inName) {
    score += 20
    reasons.push('Same company name')
  }

  // LinkedIn URL match
  const inLinkedin = String(incoming.linkedin_url || '').toLowerCase().trim()
  const exLinkedin = String(existing.linkedin_url || '').toLowerCase().trim()
  if (inLinkedin && exLinkedin && inLinkedin === exLinkedin) {
    score += 60
    reasons.push('Same LinkedIn URL')
  }

  // Same location + same role
  const inLocation = String(incoming.location || '').toLowerCase().trim()
  const exLocation = String(existing.location || '').toLowerCase().trim()
  const inRole = String(incoming.role || incoming.job_title || '').toLowerCase().trim()
  const exRole = String(existing.role || existing.job_title || '').toLowerCase().trim()
  if (inLocation && exLocation && inLocation === exLocation && inRole && exRole && inRole === exRole) {
    score += 15
    reasons.push('Same location and role')
  }

  return { score, reasons }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { type, record, slug } = await req.json() as {
      type: 'contact' | 'company'
      record: Record<string, unknown>
      slug: string
    }

    if (!type || !record || !slug) {
      return NextResponse.json({ error: 'type, record, and slug are required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const table = type === 'contact' ? 'crm_contacts' : 'crm_companies'

    const { data: existingRecords, error } = await supabase
      .from(table)
      .select('*')
      .eq('slug', slug)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duplicates: ScoredDuplicate[] = []

    for (const existing of existingRecords || []) {
      // Skip self-comparison
      if (record.id && existing.id === record.id) continue

      const { score, reasons } = scoreRecords(record, existing as Record<string, unknown>)

      if (score >= 60) {
        duplicates.push({
          id: existing.id as string,
          name: String(existing.name || existing.company_name || ''),
          email: (existing.email as string) || null,
          score,
          confidence: score >= 100 ? 'certain' : score >= 85 ? 'likely' : 'possible',
          matchReasons: reasons,
        })
      }
    }

    // Sort by score descending
    duplicates.sort((a: ScoredDuplicate, b: ScoredDuplicate) => b.score - a.score)

    return NextResponse.json({ duplicates })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
