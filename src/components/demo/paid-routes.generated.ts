// GENERATED — paid API routes the demo fetch guard intercepts.
// Every route.ts under src/app/api that imports @/lib/ai/guards (except the
// read-only ai-spend counters), plus /api/ai/* and /api/roundup/voice-script.
// Regenerate with:
//   grep -rlE "from '@/lib/ai/guards'" src/app/api | grep 'route.ts$' | grep -v ai-spend \
//     | sed -E 's#src/app(/api/.*)/route.ts#\1#' | sort

export const PAID_API_PATHS: readonly string[] = [
  '/api/ai/boxing',
  '/api/ai/club-staff',
  '/api/ai/cricket',
  '/api/ai/cricket/quick-action',
  '/api/ai/darts',
  '/api/ai/dept-summary',
  '/api/ai/discover-companies',
  '/api/ai/email-draft',
  '/api/ai/fan-insights',
  '/api/ai/football',
  '/api/ai/football-search',
  '/api/ai/golf',
  '/api/ai/impact',
  '/api/ai/marketing',
  '/api/ai/meeting-slots',
  '/api/ai/nonleague',
  '/api/ai/notifications',
  '/api/ai/opposition-report',
  '/api/ai/overview',
  '/api/ai/post-match',
  '/api/ai/press-conference',
  '/api/ai/recruit-research',
  '/api/ai/rugby',
  '/api/ai/tennis',
  '/api/ai/transfer-researcher',
  '/api/ai/womens',
  '/api/aria/company-finder',
  '/api/aria/contact-finder',
  '/api/crm/aria',
  '/api/crm/brief',
  '/api/crm/dedupe/verify',
  '/api/crm/enrich',
  '/api/demo/voice-command',
  '/api/faq-builder',
  '/api/football/comparison/ai-analysis',
  '/api/football/match-reports',
  '/api/impact/sport-network',
  '/api/lesson-plan',
  '/api/report-writer',
  '/api/tts',
  '/api/tts/test',
  '/api/wiki-builder',
  '/api/workflows/school/cover-work',
  '/api/workflows/school/governor-report',
  '/api/workflows/school/ofsted',
  '/api/roundup/voice-script',
]

// Any /api/ai/* path is paid, including ones added after this list was generated.
export const PAID_API_PREFIXES: readonly string[] = ['/api/ai']
