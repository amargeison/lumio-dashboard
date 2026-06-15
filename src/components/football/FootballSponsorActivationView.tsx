'use client'

import SponsorActivationView, { type SponsorRoiProfile } from '@/components/commercial/SponsorActivationView'

const MENS: SponsorRoiProfile = {
  kpis: [
    { label: 'Contracted media value', value: '£2.1m', sub: 'committed deliverables', color: '#F9FAFB' },
    { label: 'Delivered YTD', value: '£1.6m', sub: '76% of season target', color: '#60A5FA' },
    { label: 'Fulfilment', value: '92%', sub: 'obligations on track', color: '#22C55E' },
    { label: 'Sponsor NPS', value: '64', sub: 'partner satisfaction', color: '#F1C40F' },
  ],
  fulfilment: [
    { sponsor: 'Meridian Watches (Principal)', obligations: 24, delivered: 22, pct: 92, mediaValue: '£640k' },
    { sponsor: 'Apex Performance (Kit)', obligations: 18, delivered: 17, pct: 94, mediaValue: '£380k' },
    { sponsor: 'Vanta Sport', obligations: 16, delivered: 14, pct: 88, mediaValue: '£300k' },
    { sponsor: 'Northshore Brewing (Stadium)', obligations: 12, delivered: 10, pct: 83, mediaValue: '£160k' },
    { sponsor: 'Riverside Healthcare', obligations: 10, delivered: 10, pct: 100, mediaValue: '£120k' },
  ],
  calendar: [
    { date: '12 Apr', sponsor: 'Meridian Watches', activity: 'LED takeover + matchday hosting', channel: 'Matchday' },
    { date: '18 Apr', sponsor: 'Apex Performance', activity: 'Open-training content shoot', channel: 'Social' },
    { date: '24 Apr', sponsor: 'Northshore Brewing', activity: 'Fan-zone activation', channel: 'Matchday' },
    { date: '02 May', sponsor: 'Riverside Healthcare', activity: 'Community health day', channel: 'PR' },
    { date: '09 May', sponsor: 'Vanta Sport', activity: 'Kit content shoot', channel: 'Social' },
  ],
  channels: [
    { channel: 'LED & perimeter', value: '£620k', pct: 100 }, { channel: 'Social & digital', value: '£480k', pct: 77 },
    { channel: 'Broadcast exposure', value: '£340k', pct: 55 }, { channel: 'Matchday & hospitality', value: '£160k', pct: 26 },
  ],
  roi: [
    { sponsor: 'Apex Performance', fee: '£185k', mediaValue: '£380k', ratio: 2.1 },
    { sponsor: 'Riverside Healthcare', fee: '£62k', mediaValue: '£120k', ratio: 1.9 },
    { sponsor: 'Northshore Brewing', fee: '£95k', mediaValue: '£160k', ratio: 1.7 },
    { sponsor: 'Meridian Watches', fee: '£420k', mediaValue: '£640k', ratio: 1.5 },
  ],
}

export default function FootballSponsorActivationView() {
  return <SponsorActivationView accent="#003DA5" profile={MENS} />
}
