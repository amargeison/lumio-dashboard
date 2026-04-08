// Match report template engine.
// Converts a (template, claudeReportData) pair into rendered sections.
// Never throws — returns null sections on error.

export interface SectionConfig {
  id: string
  title: string
  type: 'narrative' | 'stats_table' | 'player_ratings' | 'timeline' | 'quote' | 'image_placeholder'
  enabled: boolean
  order: number
}

export interface ReportTemplate {
  id: string
  template_name: string
  template_type: string
  sections: SectionConfig[]
}

export interface MatchReportData {
  headline?: string
  result?: 'Win' | 'Draw' | 'Loss'
  matchSummary?: string
  firstHalfSummary?: string
  secondHalfSummary?: string
  keyMoments?: { minute: number; type: string; description: string; player: string }[]
  playerRatings?: { name: string; position: string; rating: number; comment: string }[]
  manOfTheMatch?: { name: string; rating: number; reason: string }
  tacticalAnalysis?: string
  managerQuote?: string
  lookingAhead?: string
  performanceRating?: number
}

export interface StatRow { label: string; value: string }
export interface PlayerRating { name: string; position: string; rating: number; comment: string }
export interface TimelineEvent { minute: number; type: string; description: string; player: string }

export type SectionContent = string | StatRow[] | PlayerRating[] | TimelineEvent[] | null

export interface BuiltSection {
  id: string
  title: string
  type: SectionConfig['type']
  content: SectionContent
  enabled: boolean
}

export interface BuiltReport {
  sections: BuiltSection[]
  wordCount: number
  generatedAt: string
}

function safe<T>(fn: () => T): T | null {
  try { return fn() } catch { return null }
}

function buildNarrative(data: MatchReportData, clubName: string): string {
  const parts: string[] = []
  if (data.headline) parts.push(data.headline.toUpperCase())
  if (data.matchSummary) parts.push(data.matchSummary)
  if (data.firstHalfSummary) parts.push(`First half: ${data.firstHalfSummary}`)
  if (data.secondHalfSummary) parts.push(`Second half: ${data.secondHalfSummary}`)
  if (data.tacticalAnalysis) parts.push(`Tactical: ${data.tacticalAnalysis}`)
  if (data.lookingAhead) parts.push(data.lookingAhead)
  return parts.join('\n\n') || `${clubName} match report.`
}

function buildStatsTable(data: MatchReportData): StatRow[] {
  const rows: StatRow[] = []
  if (data.result) rows.push({ label: 'Result', value: data.result })
  if (typeof data.performanceRating === 'number') rows.push({ label: 'Performance Rating', value: `${data.performanceRating}/10` })
  if (data.keyMoments) {
    const goals = data.keyMoments.filter((m) => m.type === 'Goal').length
    const yellows = data.keyMoments.filter((m) => m.type === 'Yellow Card').length
    const reds = data.keyMoments.filter((m) => m.type === 'Red Card').length
    rows.push({ label: 'Goals (combined)', value: String(goals) })
    rows.push({ label: 'Yellow Cards', value: String(yellows) })
    rows.push({ label: 'Red Cards', value: String(reds) })
  }
  return rows
}

function buildPlayerRatings(data: MatchReportData): PlayerRating[] {
  return Array.isArray(data.playerRatings) ? data.playerRatings.slice(0, 5) : []
}

function buildTimeline(data: MatchReportData): TimelineEvent[] {
  return Array.isArray(data.keyMoments) ? data.keyMoments : []
}

function buildQuote(data: MatchReportData): string {
  return data.managerQuote ?? ''
}

export function buildReportFromTemplate(
  template: ReportTemplate,
  reportData: MatchReportData,
  clubName: string
): BuiltReport {
  const sectionConfigs = Array.isArray(template?.sections) ? template.sections : []
  const ordered = sectionConfigs.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const built: BuiltSection[] = ordered.map((cfg) => {
    let content: SectionContent = null
    if (!cfg.enabled) {
      return { id: cfg.id, title: cfg.title, type: cfg.type, content: null, enabled: false }
    }
    switch (cfg.type) {
      case 'narrative':
        content = safe(() => buildNarrative(reportData, clubName))
        break
      case 'stats_table':
        content = safe(() => buildStatsTable(reportData))
        break
      case 'player_ratings':
        content = safe(() => buildPlayerRatings(reportData))
        break
      case 'timeline':
        content = safe(() => buildTimeline(reportData))
        break
      case 'quote':
        content = safe(() => buildQuote(reportData))
        break
      case 'image_placeholder':
        content = ''
        break
      default:
        content = null
    }
    return { id: cfg.id, title: cfg.title, type: cfg.type, content, enabled: true }
  })

  let wordCount = 0
  for (const s of built) {
    if (typeof s.content === 'string') {
      wordCount += s.content.split(/\s+/).filter(Boolean).length
    } else if (Array.isArray(s.content)) {
      for (const item of s.content) {
        const txt = typeof item === 'string' ? item : Object.values(item).join(' ')
        wordCount += String(txt).split(/\s+/).filter(Boolean).length
      }
    }
  }

  return {
    sections: built,
    wordCount,
    generatedAt: new Date().toISOString(),
  }
}

export function renderSectionAsText(section: BuiltSection): string {
  if (!section.enabled || section.content == null) return ''
  const c = section.content
  if (typeof c === 'string') return `${section.title}\n\n${c}\n`
  if (Array.isArray(c)) {
    if (c.length === 0) return ''
    if ('label' in (c[0] as any)) {
      return `${section.title}\n` + (c as StatRow[]).map((r) => `- ${r.label}: ${r.value}`).join('\n') + '\n'
    }
    if ('rating' in (c[0] as any) && 'name' in (c[0] as any)) {
      return `${section.title}\n` + (c as PlayerRating[]).map((p) => `- ${p.name} (${p.position}) ${p.rating}/10 — ${p.comment}`).join('\n') + '\n'
    }
    if ('minute' in (c[0] as any)) {
      return `${section.title}\n` + (c as TimelineEvent[]).map((e) => `- ${e.minute}' ${e.type}: ${e.description} (${e.player})`).join('\n') + '\n'
    }
  }
  return ''
}

export function estimateReadingTime(wordCount: number): string {
  const mins = Math.max(1, Math.round(wordCount / 220))
  return `${mins} min read`
}
