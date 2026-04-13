// ─── Static AI Summaries for Demo Shells — Today Tab Only ────────────────────
// Single source of truth. One entry per sport for the dashboard/landing page.
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
  darts:  { dashboard: TODO_SUMMARY },
  boxing: { dashboard: TODO_SUMMARY },
  golf:   { dashboard: TODO_SUMMARY },
  tennis: { insights:  TODO_SUMMARY },
  rugby:  { dashboard: TODO_SUMMARY },
}

export function getDemoAISummary(
  sport: string,
  departmentKey: string
): DemoAISummary | null {
  return DEMO_AI_SUMMARIES[sport]?.[departmentKey] ?? null
}
