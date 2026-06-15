'use client'

import EnergySustainabilityView, { type EnergyProfile } from '@/components/facilities/EnergySustainabilityView'

const WOMENS: EnergyProfile = {
  kpis: [
    { label: 'Energy spend', value: '£210k', sub: 'per year', color: '#F9FAFB' },
    { label: 'Carbon', value: '480 t', sub: 'CO₂e / yr · −8% YoY', color: '#22C55E' },
    { label: 'Renewable', value: '52%', sub: 'of electricity', color: '#F472B6' },
    { label: 'Net-zero target', value: '2032', sub: 'operations', color: '#EC4899' },
  ],
  utilities: [
    { name: 'Electricity', usage: '0.6 GWh', cost: '£150k', yoy: 1 },
    { name: 'Gas', usage: '0.9 GWh', cost: '£85k', yoy: -4 },
    { name: 'Water', usage: '6,000 m³', cost: '£22k', yoy: -1 },
    { name: 'Waste / recycling', usage: '32 t', cost: '£9k', yoy: -6 },
  ],
  carbon: [
    { source: 'Travel & logistics', tco2e: 180 }, { source: 'Matchday energy', tco2e: 140 },
    { source: 'Facilities heating', tco2e: 90 }, { source: 'Catering & waste', tco2e: 70 },
  ],
  carbonTrend: [{ year: '2022', tco2e: 620 }, { year: '2023', tco2e: 560 }, { year: '2024', tco2e: 520 }, { year: '2025', tco2e: 480 }],
  roadmap: [
    { year: '2025', milestone: 'LED training-pitch & clubhouse lighting complete', status: 'Done' },
    { year: '2026', milestone: 'Solar PV on the clubhouse roof', status: 'In progress' },
    { year: '2028', milestone: 'Electric team minibus for away travel', status: 'Planned' },
    { year: '2030', milestone: 'Ground-source heat pump for the clubhouse', status: 'Planned' },
    { year: '2032', milestone: 'Net-zero operations (Scope 1 & 2)', status: 'Planned' },
  ],
  initiatives: [
    { name: 'LED lighting (clubhouse & training)', status: 'Done', impact: '−48 tCO₂e / yr' },
    { name: 'Solar PV — clubhouse', status: 'In progress', impact: '~90 MWh / yr' },
    { name: 'Electric team minibus', status: 'Planned', impact: '−60 tCO₂e / yr' },
    { name: 'Reusable cups (matchday)', status: 'Done', impact: '−180k items / yr' },
    { name: 'Locally-sourced matchday catering', status: 'Done', impact: '−12 tCO₂e / yr' },
    { name: 'Train-first away travel policy', status: 'In progress', impact: '−40 tCO₂e / yr' },
  ],
  esg: { env: 78, social: 88, gov: 80 },
}

export default function WomensEnergyView() {
  return <EnergySustainabilityView accent="#BE185D" profile={WOMENS} />
}
