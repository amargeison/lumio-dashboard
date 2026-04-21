import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lumio Rugby — Championship Rugby Club OS | GPS · Cap · AI · Franchise',
  description: 'Salary cap management, GPS heatmaps, AI Halftime Brief, and franchise readiness tracking for Championship and Premiership rugby clubs. Powered by Claude API and Lumio GPS.',
}

export default function RugbyMarketingLayout({ children }: { children: React.ReactNode }) {
  return children
}
