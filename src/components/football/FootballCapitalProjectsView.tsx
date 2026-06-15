'use client'

import CapitalProjectsView, { type CapitalProfile } from '@/components/facilities/CapitalProjectsView'

const MENS: CapitalProfile = {
  kpis: [
    { label: 'Active projects', value: '4', sub: '1 complete this year', color: '#F9FAFB' },
    { label: 'Committed capital', value: '£42m', sub: 'across the programme', color: '#60A5FA' },
    { label: 'Spent to date', value: '£14m', sub: '33% drawn', color: '#F9FAFB' },
    { label: 'On budget', value: '96%', sub: '+£0.4m contingency used', color: '#22C55E' },
  ],
  projects: [
    { name: 'East Stand expansion → 30,000', status: 'On site', budget: '£38m', spent: '£12m', pct: 32, due: '2030' },
    { name: 'Training ground Phase 2', status: 'Approved', budget: '£6m', spent: '£1.2m', pct: 18, due: '2028' },
    { name: 'LED & solar programme', status: 'On site', budget: '£2.2m', spent: '£0.8m', pct: 60, due: '2027' },
    { name: 'Hospitality suite refurb', status: 'Complete', budget: '£1.4m', spent: '£1.4m', pct: 100, due: '2025' },
  ],
  headline: 'East Stand expansion',
  phases: [
    { name: 'Feasibility & design', period: '2024–25', pct: 100, status: 'Complete' },
    { name: 'Planning permission', period: '2025', pct: 100, status: 'Complete' },
    { name: 'Enabling works', period: '2026', pct: 45, status: 'On site' },
    { name: 'Main construction', period: '2027–29', pct: 0, status: 'Approved' },
    { name: 'Fit-out & seating', period: '2029–30', pct: 0, status: 'Planning' },
    { name: 'Handover & first game', period: '2030', pct: 0, status: 'Planning' },
  ],
  funding: [
    { source: 'Owner equity', amount: '£20m', pct: 100 }, { source: 'Bank facility', amount: '£12m', pct: 60 },
    { source: 'Naming-rights pre-sale', amount: '£6m', pct: 30 }, { source: 'Regeneration grant', amount: '£4m', pct: 20 },
  ],
  planning: [
    { label: 'Outline permission', status: 'Granted' }, { label: 'Reserved matters', status: 'Approved' },
    { label: 'Building regs', status: 'In review' }, { label: 'Safety certificate (expanded)', status: 'Pending' },
  ],
  milestones: [
    { year: '2025', milestone: '30,000-seat masterplan submitted & approved', status: 'Done' },
    { year: '2026', milestone: 'Enabling works begin on East Stand', status: 'In progress' },
    { year: '2028', milestone: 'Steel frame topping-out', status: 'Planned' },
    { year: '2030', milestone: 'First fixture in the expanded stand', status: 'Planned' },
  ],
}

export default function FootballCapitalProjectsView() {
  return <CapitalProjectsView accent="#003DA5" profile={MENS} />
}
