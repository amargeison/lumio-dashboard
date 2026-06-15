'use client'

import AssetRegisterView, { type AssetProfile } from '@/components/facilities/AssetRegisterView'

const WOMENS: AssetProfile = {
  kpis: [
    { label: 'Tracked assets', value: '320', sub: 'across all sites', color: '#F9FAFB' },
    { label: 'Net book value', value: '£6.4m', sub: 'clubhouse + facilities', color: '#F472B6' },
    { label: 'Open work orders', value: '5', sub: '1 high priority', color: '#F59E0B' },
    { label: 'PPM compliance', value: '92%', sub: 'rolling 12 months', color: '#22C55E' },
  ],
  assets: [
    { name: 'Floodlights (main pitch)', category: 'Electrical', condition: 'Good', warranty: '2030', nextService: 'Aug 2026', status: 'OK' },
    { name: 'Clubhouse boiler', category: 'Mechanical', condition: 'Fair', warranty: '2027', nextService: 'Jul 2026', status: 'Monitor' },
    { name: 'Gym & S&C equipment', category: 'Equipment', condition: 'Good', warranty: '2029', nextService: 'Jun 2026', status: 'OK' },
    { name: '3G pitch surface', category: 'Grounds', condition: 'Good', warranty: '2032', nextService: 'Sep 2026', status: 'OK' },
    { name: 'PA / matchday system', category: 'AV', condition: 'Fair', warranty: '2026', nextService: 'Oct 2026', status: 'Service due' },
    { name: 'Team minibus', category: 'Vehicles', condition: 'Good', warranty: '2028', nextService: 'Jul 2026', status: 'OK' },
  ],
  workOrders: [
    { ref: 'WO-210', asset: 'Clubhouse boiler — intermittent fault', priority: 'High', assignee: 'FM team', due: '13 Apr', status: 'Open' },
    { ref: 'WO-208', asset: 'Gym AC unit service', priority: 'Medium', assignee: 'BrightFM', due: '15 Apr', status: 'In progress' },
    { ref: 'WO-205', asset: 'Floodlight lamp replacement', priority: 'Low', assignee: 'Grounds', due: '19 Apr', status: 'Open' },
  ],
  ppm: [
    { task: 'Floodlight check', frequency: 'Quarterly', nextDue: 'Jul 2026', compliance: 100 },
    { task: 'Boiler service', frequency: 'Annual', nextDue: 'Jul 2026', compliance: 90 },
    { task: 'Fire systems inspection', frequency: '6-monthly', nextDue: 'Jun 2026', compliance: 95 },
    { task: 'Gym PAT testing', frequency: 'Annual', nextDue: 'May 2026', compliance: 88 },
  ],
  value: [
    { category: 'Clubhouse & facilities', nbv: '£3.8m', pct: 100 }, { category: 'Plant', nbv: '£0.9m', pct: 24 },
    { category: 'Gym & recovery', nbv: '£0.7m', pct: 18 }, { category: 'Pitches', nbv: '£0.6m', pct: 16 },
    { category: 'Vehicles', nbv: '£0.4m', pct: 11 },
  ],
}

export default function WomensAssetRegisterView() {
  return <AssetRegisterView accent="#BE185D" profile={WOMENS} />
}
