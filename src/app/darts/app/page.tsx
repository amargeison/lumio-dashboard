import { routeSportApp } from '@/lib/server/sport-app-router'

export const dynamic = 'force-dynamic'

export default async function DartsAppRouter() {
  await routeSportApp('darts')
}
