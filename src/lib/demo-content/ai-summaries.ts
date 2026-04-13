// ─── Static AI Summaries for Demo Shells ─────────────────────────────────────
// Single source of truth for all demo AI content.
// TODO: All content below is placeholder. Fill in a separate pass.

export type DemoAISummary = {
  summary: string
  highlights: string[]
}

const TODO_SUMMARY: DemoAISummary = {
  summary: 'TODO: write summary content for this page.',
  highlights: [
    'TODO: highlight 1',
    'TODO: highlight 2',
    'TODO: highlight 3',
    'TODO: highlight 4',
    'TODO: highlight 5',
  ],
}

export const DEMO_AI_SUMMARIES: Record<string, Record<string, DemoAISummary>> = {
  darts: {
    dashboard: TODO_SUMMARY,
    default: TODO_SUMMARY,
    orderofmerit: TODO_SUMMARY,
    averages: TODO_SUMMARY,
    checkout: TODO_SUMMARY,
    opponentintel: TODO_SUMMARY,
    practicelog: TODO_SUMMARY,
    mental: TODO_SUMMARY,
    sponsorship: TODO_SUMMARY,
    financial: TODO_SUMMARY,
    travel: TODO_SUMMARY,
  },
  boxing: {
    dashboard: TODO_SUMMARY,
    default: TODO_SUMMARY,
    training: TODO_SUMMARY,
    opponent: TODO_SUMMARY,
    weight: TODO_SUMMARY,
    medical: TODO_SUMMARY,
    rankings: TODO_SUMMARY,
    financial: TODO_SUMMARY,
    sponsorship: TODO_SUMMARY,
  },
  golf: {
    dashboard: TODO_SUMMARY,
    default: TODO_SUMMARY,
    owgr: TODO_SUMMARY,
    strokes: TODO_SUMMARY,
    coursefit: TODO_SUMMARY,
    practicelog: TODO_SUMMARY,
    financial: TODO_SUMMARY,
    mental: TODO_SUMMARY,
    sponsorship: TODO_SUMMARY,
  },
  tennis: {
    default: TODO_SUMMARY,
    insights: TODO_SUMMARY,
    morning: TODO_SUMMARY,
    performance: TODO_SUMMARY,
    matchprep: TODO_SUMMARY,
    matchreports: TODO_SUMMARY,
    opponentintel: TODO_SUMMARY,
    schedule: TODO_SUMMARY,
    rankings: TODO_SUMMARY,
    surface: TODO_SUMMARY,
    physiorecovery: TODO_SUMMARY,
    travel: TODO_SUMMARY,
    mental: TODO_SUMMARY,
    sponsorship: TODO_SUMMARY,
    media: TODO_SUMMARY,
    financial: TODO_SUMMARY,
    agent: TODO_SUMMARY,
    entries: TODO_SUMMARY,
    forecaster: TODO_SUMMARY,
    teamhub: TODO_SUMMARY,
    video: TODO_SUMMARY,
  },
  rugby: {
    dashboard: TODO_SUMMARY,
  },
  // Cricket has no AI section component currently
  // Football/nonleague/grassroots/womens use CMS dashboard, not sport portals
}

export function getDemoAISummary(
  sport: string,
  departmentKey: string
): DemoAISummary | null {
  return DEMO_AI_SUMMARIES[sport]?.[departmentKey] ?? null
}
