'use client'

import ProcurementContractsView, { type ProcurementProfile } from '@/components/operations/ProcurementContractsView'

const WOMENS: ProcurementProfile = {
  kpis: [
    { label: 'Active contracts', value: '16', sub: 'across the club', color: '#F9FAFB' },
    { label: 'Annual spend', value: '£680k', sub: 'contracted', color: '#F472B6' },
    { label: 'Renewals (90d)', value: '3', sub: '1 to re-tender', color: '#F59E0B' },
    { label: 'Savings YTD', value: '£28k', sub: 'vs prior contracts', color: '#22C55E' },
  ],
  contracts: [
    { supplier: 'Sentinel Security', category: 'Matchday security', value: '£64k', renewal: 'Jul 2027', status: 'Active', owner: 'Operations' },
    { supplier: 'Pinkertons Catering', category: 'Catering & hospitality', value: '£92k', renewal: 'Jun 2026', status: 'Renewal due', owner: 'Commercial' },
    { supplier: 'BrightFM', category: 'Facilities management', value: '£48k', renewal: 'Mar 2027', status: 'Active', owner: 'Facilities' },
    { supplier: 'GreenTurf', category: 'Grounds maintenance', value: '£22k', renewal: 'Aug 2026', status: 'Active', owner: 'Grounds' },
    { supplier: 'MedX Cover', category: 'Medical & ambulance', value: '£18k', renewal: 'May 2026', status: 'Renewal due', owner: 'Medical' },
    { supplier: 'Vanta Sport', category: 'Kit & equipment', value: '£85k', renewal: '2028', status: 'Active', owner: 'Commercial' },
  ],
  renewals: [
    { supplier: 'Pinkertons Catering', date: 'Jun 2026', value: '£92k', action: 'Re-tender' },
    { supplier: 'MedX Cover', date: 'May 2026', value: '£18k', action: 'Renew' },
    { supplier: 'Cleaning contract', date: 'Sep 2026', value: '£24k', action: 'Renew' },
  ],
  scorecards: [
    { supplier: 'GreenTurf', service: 'Grounds', quality: 5, price: 5, reliability: 5, overall: 5.0 },
    { supplier: 'Sentinel Security', service: 'Security', quality: 4, price: 4, reliability: 5, overall: 4.3 },
    { supplier: 'BrightFM', service: 'Facilities mgmt', quality: 4, price: 4, reliability: 5, overall: 4.3 },
    { supplier: 'Pinkertons Catering', service: 'Catering', quality: 4, price: 4, reliability: 4, overall: 4.0 },
  ],
  tenders: [
    { name: 'Matchday catering partner', stage: 'Evaluation', value: '£92k', bidders: 3, decision: 'May 2026' },
    { name: 'Cleaning contract', stage: 'RFP issued', value: '£24k', bidders: 4, decision: 'Jun 2026' },
  ],
}

export default function WomensProcurementView() {
  return <ProcurementContractsView accent="#BE185D" profile={WOMENS} />
}
