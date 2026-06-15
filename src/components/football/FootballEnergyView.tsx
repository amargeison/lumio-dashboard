'use client'

import EnergySustainabilityView, { type EnergyProfile } from '@/components/facilities/EnergySustainabilityView'

const MENS: EnergyProfile = {
  kpis: [
    { label: 'Energy spend', value: '£1.8m', sub: 'per year', color: '#F9FAFB' },
    { label: 'Carbon', value: '4,200 t', sub: 'CO₂e / yr · −7% YoY', color: '#22C55E' },
    { label: 'Renewable', value: '38%', sub: 'of electricity', color: '#60A5FA' },
    { label: 'Net-zero target', value: '2035', sub: 'operations', color: '#F1C40F' },
  ],
  utilities: [
    { name: 'Electricity', usage: '4.2 GWh', cost: '£980k', yoy: 3 },
    { name: 'Gas', usage: '6.1 GWh', cost: '£540k', yoy: -5 },
    { name: 'Water', usage: '38,000 m³', cost: '£95k', yoy: -2 },
    { name: 'Waste / recycling', usage: '210 t', cost: '£42k', yoy: -8 },
  ],
  carbon: [
    { source: 'Matchday energy', tco2e: 1800 }, { source: 'Travel & logistics', tco2e: 1200 },
    { source: 'Facilities heating', tco2e: 700 }, { source: 'Catering & waste', tco2e: 500 },
  ],
  carbonTrend: [{ year: '2022', tco2e: 5200 }, { year: '2023', tco2e: 4800 }, { year: '2024', tco2e: 4500 }, { year: '2025', tco2e: 4200 }],
  roadmap: [
    { year: '2025', milestone: 'LED floodlights + concourse lighting complete', status: 'Done' },
    { year: '2027', milestone: 'Solar PV canopy on the East Stand roof', status: 'In progress' },
    { year: '2029', milestone: 'Ground-source heat pump for stadium heating', status: 'Planned' },
    { year: '2032', milestone: 'Club fleet & matchday transport fully electric', status: 'Planned' },
    { year: '2035', milestone: 'Net-zero operations (Scope 1 & 2)', status: 'Planned' },
  ],
  initiatives: [
    { name: 'LED stadium & training lighting', status: 'Done', impact: '−420 tCO₂e / yr' },
    { name: 'Solar PV — East Stand', status: 'In progress', impact: '~600 MWh / yr' },
    { name: 'EV charging hub (car park)', status: 'In progress', impact: '24 bays' },
    { name: 'Rainwater harvesting (pitch irrigation)', status: 'Planned', impact: '−4,000 m³ water' },
    { name: 'Single-use plastic ban (concourses)', status: 'Done', impact: '−1.2m items / yr' },
    { name: 'Green steward & coach travel scheme', status: 'Done', impact: '−180 tCO₂e / yr' },
  ],
  esg: { env: 72, social: 81, gov: 78 },
}

export default function FootballEnergyView() {
  return <EnergySustainabilityView accent="#003DA5" profile={MENS} />
}
