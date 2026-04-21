import { routeSportApp } from '@/lib/server/sport-app-router'

// Server-side router. No UI — always redirects. See sport-app-router.ts
// for the branch logic; the point of this page is to route founders
// THROUGH /tennis/[slug]/layout.tsx so the PWA install-token mint runs
// on the final render.
export const dynamic = 'force-dynamic'

export default async function TennisAppRouter() {
  await routeSportApp('tennis')
}
