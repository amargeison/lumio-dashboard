'use client'

import TicketingYieldView, { type TicketingProfile } from '@/components/commercial/TicketingYieldView'

const WOMENS: TicketingProfile = {
  kpis: [
    { label: 'Season tickets', value: '1,650', sub: 'of 2,000 target', color: '#F9FAFB' },
    { label: 'Renewal rate', value: '84%', sub: '+5pt YoY', color: '#22C55E' },
    { label: 'Avg attendance', value: '2,847', sub: '81% of capacity', color: '#F472B6' },
    { label: 'Matchday revenue', value: '£210k', sub: 'season to date', color: '#EC4899' },
  ],
  renewals: [
    { label: 'Renewed', value: '1,386', pct: 84, tone: 'good' },
    { label: 'Lapsed', value: '264', pct: 16, tone: 'bad' },
    { label: 'New sign-ups', value: '410', pct: 65, tone: 'info' },
    { label: 'Pending', value: '90', pct: 25, tone: 'info' },
  ],
  fixtures: [
    { fixture: 'vs Castleton Women', sold: 3100, capacity: 3500, tier: 'Premium', forecast: '£52k' },
    { fixture: 'vs Glenmoor Women', sold: 2600, capacity: 3500, tier: 'Standard', forecast: '£40k' },
    { fixture: 'vs Hartwell Women', sold: 2400, capacity: 3500, tier: 'Standard', forecast: '£36k' },
    { fixture: 'vs Ridgefield Women', sold: 1900, capacity: 3500, tier: 'Value', forecast: '£24k' },
  ],
  pricing: [
    { band: 'Adult', price: '£14', sold: 920, capacity: 1400 },
    { band: 'Concession (65+)', price: '£8', sold: 430, capacity: 700 },
    { band: 'Under-18', price: '£4', sold: 280, capacity: 500 },
    { band: 'Hospitality', price: '£45', sold: 60, capacity: 120 },
  ],
  access: [
    { label: 'Digital tickets', value: '78%' }, { label: 'Turnstile throughput', value: '300 / min' },
    { label: 'Official resale', value: '90 listings' }, { label: 'No-show rate', value: '8%' },
  ],
}

export default function WomensTicketingView() {
  return <TicketingYieldView accent="#BE185D" profile={WOMENS} />
}
