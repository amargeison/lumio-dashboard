'use client'

import AssetRegisterView, { type AssetProfile } from '@/components/facilities/AssetRegisterView'

const MENS: AssetProfile = {
  kpis: [
    { label: 'Tracked assets', value: '1,240', sub: 'across all sites', color: '#F9FAFB' },
    { label: 'Net book value', value: '£58m', sub: 'stadium + facilities', color: '#60A5FA' },
    { label: 'Open work orders', value: '14', sub: '3 high priority', color: '#F59E0B' },
    { label: 'PPM compliance', value: '94%', sub: 'rolling 12 months', color: '#22C55E' },
  ],
  assets: [
    { name: 'Floodlight rig (4 corner)', category: 'Electrical', condition: 'Good', warranty: '2029', nextService: 'Aug 2026', status: 'OK' },
    { name: 'Undersoil heating', category: 'Mechanical', condition: 'Good', warranty: '2031', nextService: 'Jul 2026', status: 'OK' },
    { name: 'Main scoreboard / big screen', category: 'AV / broadcast', condition: 'Fair', warranty: '2027', nextService: 'Sep 2026', status: 'Monitor' },
    { name: 'HVAC plant (hospitality)', category: 'Mechanical', condition: 'Good', warranty: '2030', nextService: 'Aug 2026', status: 'OK' },
    { name: 'Turnstile & access system', category: 'IT / security', condition: 'Fair', warranty: '2026', nextService: 'Oct 2026', status: 'Service due' },
    { name: 'CCTV & PA system', category: 'IT / security', condition: 'Good', warranty: '2028', nextService: 'Jul 2026', status: 'OK' },
  ],
  workOrders: [
    { ref: 'WO-1042', asset: 'Floodlight bay 3 — lamp failure', priority: 'High', assignee: 'FM team', due: '12 Apr', status: 'Open' },
    { ref: 'WO-1039', asset: 'Hospitality AC fault — Founders Suite', priority: 'Medium', assignee: 'BrightFM', due: '14 Apr', status: 'In progress' },
    { ref: 'WO-1035', asset: 'Turnstile 6 — card reader', priority: 'High', assignee: 'Sentinel', due: '11 Apr', status: 'Open' },
    { ref: 'WO-1031', asset: 'Pitch irrigation valve leak', priority: 'Low', assignee: 'Grounds', due: '18 Apr', status: 'Open' },
  ],
  ppm: [
    { task: 'Floodlight thermal check', frequency: 'Quarterly', nextDue: 'Jul 2026', compliance: 100 },
    { task: 'Standby generator load test', frequency: 'Monthly', nextDue: 'Apr 2026', compliance: 100 },
    { task: 'Fire systems inspection', frequency: '6-monthly', nextDue: 'Jun 2026', compliance: 95 },
    { task: 'Lift / hoist inspection (LOLER)', frequency: '6-monthly', nextDue: 'May 2026', compliance: 90 },
    { task: 'HVAC full service', frequency: 'Annual', nextDue: 'Aug 2026', compliance: 88 },
  ],
  value: [
    { category: 'Stadium structure', nbv: '£42m', pct: 100 }, { category: 'Plant & machinery', nbv: '£8m', pct: 19 },
    { category: 'Training facilities', nbv: '£3m', pct: 7 }, { category: 'IT & broadcast', nbv: '£3m', pct: 7 },
    { category: 'Vehicles & equipment', nbv: '£2m', pct: 5 },
  ],
}

export default function FootballAssetRegisterView() {
  return <AssetRegisterView accent="#003DA5" profile={MENS} />
}
