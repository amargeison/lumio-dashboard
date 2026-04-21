import type { Metadata } from 'next'
import ComingSoonPage from '../_ComingSoonPage'

export const metadata: Metadata = {
  title: 'Lumio Schools — Coming late 2026',
  description: 'The UK-first all-in-one platform for schools. Join the Lumio Schools waitlist.',
}

export default function SchoolsComingSoon() {
  return (
    <ComingSoonPage
      source="schools"
      accent="#22D3EE"
      accentFaint="rgba(34,211,238,0.08)"
      accentBorder="rgba(34,211,238,0.35)"
      pill="LUMIO SCHOOLS · LAUNCHING LATE 2026"
      h1="The UK-first all-in-one platform for schools."
      sub="MIS sync, SSO, SEND, safeguarding, parent engagement and staff ops — built for the realities of UK schools. Lumio Schools opens its waitlist for founding schools in late 2026."
      cards={[
        { title: 'UK-first MIS sync', desc: 'Roadmap: leading UK school platforms.' },
        { title: 'Google + Microsoft SSO', desc: 'One-click login for every pupil and teacher.' },
        { title: 'SEND + Safeguarding', desc: 'Ofsted-ready, in one platform.' },
        { title: 'Parent Engagement', desc: 'Attendance, homework, payments, behaviour.' },
      ]}
    />
  )
}
