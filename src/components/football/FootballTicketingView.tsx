'use client'

import TicketingYieldView, { type TicketingProfile } from '@/components/commercial/TicketingYieldView'

const MENS: TicketingProfile = {
  kpis: [
    { label: 'Season tickets', value: '14,200', sub: 'of 18,000 target', color: '#F9FAFB' },
    { label: 'Renewal rate', value: '89%', sub: '+2pt YoY', color: '#22C55E' },
    { label: 'Avg attendance', value: '18,600', sub: '78% of capacity', color: '#60A5FA' },
    { label: 'Matchday revenue', value: '£2.4m', sub: 'season to date', color: '#F1C40F' },
  ],
  renewals: [
    { label: 'Renewed', value: '12,640', pct: 89, tone: 'good' },
    { label: 'Lapsed', value: '1,560', pct: 11, tone: 'bad' },
    { label: 'New sign-ups', value: '1,840', pct: 70, tone: 'info' },
    { label: 'Pending', value: '420', pct: 30, tone: 'info' },
  ],
  fixtures: [
    { fixture: 'vs Meridian City', sold: 21800, capacity: 24000, tier: 'Premium', forecast: '£760k' },
    { fixture: 'vs Northgate City', sold: 16200, capacity: 24000, tier: 'Standard', forecast: '£540k' },
    { fixture: 'vs Eastcliff Town', sold: 14800, capacity: 24000, tier: 'Standard', forecast: '£480k' },
    { fixture: 'vs Riverton Albion', sold: 12400, capacity: 24000, tier: 'Value', forecast: '£390k' },
  ],
  pricing: [
    { band: 'Adult', price: '£32', sold: 8200, capacity: 12000 },
    { band: 'Concession (65+)', price: '£22', sold: 3400, capacity: 5000 },
    { band: 'Under-18', price: '£12', sold: 2100, capacity: 3000 },
    { band: 'Hospitality', price: '£120', sold: 480, capacity: 600 },
  ],
  access: [
    { label: 'Digital tickets', value: '84%' }, { label: 'Turnstile throughput', value: '1,100 / min' },
    { label: 'Official resale', value: '640 listings' }, { label: 'No-show rate', value: '6%' },
  ],
}

export default function FootballTicketingView() {
  return <TicketingYieldView accent="#003DA5" profile={MENS} />
}
