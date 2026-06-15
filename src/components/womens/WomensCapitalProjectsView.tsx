'use client'

import CapitalProjectsView, { type CapitalProfile } from '@/components/facilities/CapitalProjectsView'

const WOMENS: CapitalProfile = {
  kpis: [
    { label: 'Active projects', value: '3', sub: '1 complete this year', color: '#F9FAFB' },
    { label: 'Committed capital', value: '£4.2m', sub: 'across the programme', color: '#F472B6' },
    { label: 'Spent to date', value: '£1.1m', sub: '26% drawn', color: '#F9FAFB' },
    { label: 'On budget', value: '98%', sub: 'within contingency', color: '#22C55E' },
  ],
  projects: [
    { name: 'New clubhouse & changing block', status: 'Approved', budget: '£2.4m', spent: '£0.6m', pct: 22, due: '2027' },
    { name: '4G floodlit pitch', status: 'On site', budget: '£1.1m', spent: '£0.4m', pct: 48, due: '2026' },
    { name: 'Stand cover (East terrace)', status: 'Planning', budget: '£0.5m', spent: '£0.05m', pct: 8, due: '2027' },
    { name: 'Gym & recovery refurb', status: 'Complete', budget: '£0.2m', spent: '£0.2m', pct: 100, due: '2025' },
  ],
  headline: 'New clubhouse & changing block',
  phases: [
    { name: 'Feasibility & design', period: '2024–25', pct: 100, status: 'Complete' },
    { name: 'Planning application', period: '2025–26', pct: 55, status: 'On site' },
    { name: 'Groundworks', period: '2026', pct: 0, status: 'Approved' },
    { name: 'Build', period: '2026–27', pct: 0, status: 'Planning' },
    { name: 'Fit-out', period: '2027', pct: 0, status: 'Planning' },
    { name: 'Handover', period: '2027', pct: 0, status: 'Planning' },
  ],
  funding: [
    { source: 'Owner equity', amount: '£2m', pct: 100 }, { source: 'FA / league facility grant', amount: '£1.2m', pct: 60 },
    { source: 'Community crowdfund', amount: '£0.5m', pct: 25 }, { source: 'Sponsor contribution', amount: '£0.5m', pct: 25 },
  ],
  planning: [
    { label: 'Pre-application advice', status: 'Done' }, { label: 'Full application', status: 'In review' },
    { label: 'Conditions discharge', status: 'Pending' }, { label: 'Building regs', status: 'Pending' },
  ],
  milestones: [
    { year: '2025', milestone: 'Site survey & design sign-off', status: 'Done' },
    { year: '2026', milestone: '4G floodlit pitch opens', status: 'In progress' },
    { year: '2027', milestone: 'New clubhouse handover', status: 'Planned' },
    { year: '2028', milestone: 'Senior training base fully on site', status: 'Planned' },
  ],
}

export default function WomensCapitalProjectsView() {
  return <CapitalProjectsView accent="#BE185D" profile={WOMENS} />
}
