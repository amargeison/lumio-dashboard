import type { Metadata } from 'next'
import ComingSoonPage from '../_ComingSoonPage'

export const metadata: Metadata = {
  title: 'Lumio Business — Coming late 2026',
  description: 'The AI operating system for how modern businesses actually run. Join the Lumio Business waitlist.',
}

export default function BusinessComingSoon() {
  return (
    <ComingSoonPage
      source="business"
      accent="#0D9488"
      accentFaint="rgba(13,148,136,0.08)"
      accentBorder="rgba(13,148,136,0.35)"
      pill="LUMIO BUSINESS · LAUNCHING LATE 2026"
      h1="The AI operating system for how modern businesses actually run."
      sub="CRM, team intelligence, board reporting and department workflows — all in one AI-native platform. Lumio Business opens its waitlist for founding customers in late 2026."
      cards={[
        { title: 'Lumio CRM', desc: 'Built-in contact enrichment, pipeline, deals and ARIA intelligence.' },
        { title: 'Director Suite', desc: 'Board reporting, forecast modelling and KPI dashboards.' },
        { title: 'Department Workflows', desc: 'HR, Sales, Finance, Marketing on the same data.' },
        { title: 'AI Morning Briefing', desc: 'Every role sees exactly what they need, every morning.' },
      ]}
    />
  )
}
