'use client'

import ProcurementContractsView, { type ProcurementProfile } from '@/components/operations/ProcurementContractsView'

const MENS: ProcurementProfile = {
  kpis: [
    { label: 'Active contracts', value: '38', sub: 'across the club', color: '#F9FAFB' },
    { label: 'Annual spend', value: '£6.2m', sub: 'contracted', color: '#60A5FA' },
    { label: 'Renewals (90d)', value: '5', sub: '2 to re-tender', color: '#F59E0B' },
    { label: 'Savings YTD', value: '£180k', sub: 'vs prior contracts', color: '#22C55E' },
  ],
  contracts: [
    { supplier: 'Sentinel Security', category: 'Matchday security', value: '£420k', renewal: 'Jul 2027', status: 'Active', owner: 'Operations' },
    { supplier: 'Pinkertons Catering', category: 'Catering & hospitality', value: '£680k', renewal: 'Jun 2026', status: 'Renewal due', owner: 'Commercial' },
    { supplier: 'BrightFM', category: 'Facilities management', value: '£310k', renewal: 'Mar 2027', status: 'Active', owner: 'Facilities' },
    { supplier: 'GreenTurf', category: 'Grounds maintenance', value: '£95k', renewal: 'Aug 2026', status: 'Active', owner: 'Grounds' },
    { supplier: 'MedX Cover', category: 'Medical & ambulance', value: '£64k', renewal: 'May 2026', status: 'Renewal due', owner: 'Medical' },
    { supplier: 'Vanta Sport', category: 'Kit & equipment', value: '£900k', renewal: '2028', status: 'Active', owner: 'Commercial' },
    { supplier: 'Northbridge Travel', category: 'Team coach travel', value: '£240k', renewal: 'Jul 2026', status: 'Active', owner: 'Operations' },
  ],
  renewals: [
    { supplier: 'Pinkertons Catering', date: 'Jun 2026', value: '£680k', action: 'Re-tender' },
    { supplier: 'MedX Cover', date: 'May 2026', value: '£64k', action: 'Renew' },
    { supplier: 'Northbridge Travel', date: 'Jul 2026', value: '£240k', action: 'Benchmark' },
    { supplier: 'GreenTurf', date: 'Aug 2026', value: '£95k', action: 'Renew' },
    { supplier: 'Concourse cleaning', date: 'Sep 2026', value: '£120k', action: 'Re-tender' },
  ],
  scorecards: [
    { supplier: 'GreenTurf', service: 'Grounds', quality: 5, price: 5, reliability: 5, overall: 5.0 },
    { supplier: 'Sentinel Security', service: 'Security', quality: 4, price: 4, reliability: 5, overall: 4.3 },
    { supplier: 'BrightFM', service: 'Facilities mgmt', quality: 5, price: 4, reliability: 4, overall: 4.3 },
    { supplier: 'Pinkertons Catering', service: 'Catering', quality: 3, price: 4, reliability: 4, overall: 3.7 },
    { supplier: 'MedX Cover', service: 'Medical', quality: 4, price: 3, reliability: 4, overall: 3.7 },
  ],
  tenders: [
    { name: 'Concourse cleaning contract', stage: 'Evaluation', value: '£120k', bidders: 4, decision: 'May 2026' },
    { name: 'F&B concessions partner', stage: 'Shortlist', value: '£700k', bidders: 3, decision: 'Jun 2026' },
    { name: 'Stadium WiFi & connectivity upgrade', stage: 'RFP issued', value: '£450k', bidders: 5, decision: 'Jul 2026' },
  ],
}

export default function FootballProcurementView() {
  return <ProcurementContractsView accent="#003DA5" profile={MENS} />
}
