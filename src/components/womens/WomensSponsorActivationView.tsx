'use client'

import SponsorActivationView, { type SponsorRoiProfile } from '@/components/commercial/SponsorActivationView'

const WOMENS: SponsorRoiProfile = {
  kpis: [
    { label: 'Contracted media value', value: '£420k', sub: 'committed deliverables', color: '#F9FAFB' },
    { label: 'Delivered YTD', value: '£310k', sub: '74% of season target', color: '#F472B6' },
    { label: 'Fulfilment', value: '88%', sub: 'obligations on track', color: '#22C55E' },
    { label: 'Sponsor NPS', value: '71', sub: 'partner satisfaction', color: '#EC4899' },
  ],
  fulfilment: [
    { sponsor: 'Kestrel Finance (Kit)', obligations: 16, delivered: 14, pct: 88, mediaValue: '£120k' },
    { sponsor: 'NovaTech UK (Sleeve)', obligations: 12, delivered: 11, pct: 92, mediaValue: '£70k' },
    { sponsor: 'Meridian Insurance', obligations: 14, delivered: 11, pct: 79, mediaValue: '£95k' },
    { sponsor: 'Lumio Tech (Training)', obligations: 10, delivered: 10, pct: 100, mediaValue: '£45k' },
  ],
  calendar: [
    { date: '10 Apr', sponsor: 'Kestrel Finance', activity: 'LED + matchday hosting', channel: 'Matchday' },
    { date: '16 Apr', sponsor: 'NovaTech UK', activity: 'Player content series', channel: 'Social' },
    { date: '23 Apr', sponsor: 'Meridian Insurance', activity: 'Hospitality day', channel: 'Matchday' },
    { date: '01 May', sponsor: 'Lumio Tech', activity: 'Academy pathway feature', channel: 'PR' },
  ],
  channels: [
    { channel: 'Social & digital', value: '£140k', pct: 100 }, { channel: 'LED & perimeter', value: '£95k', pct: 68 },
    { channel: 'Matchday & hospitality', value: '£45k', pct: 32 }, { channel: 'Broadcast exposure', value: '£30k', pct: 21 },
  ],
  roi: [
    { sponsor: 'Lumio Tech', fee: '£18k', mediaValue: '£45k', ratio: 2.5 },
    { sponsor: 'NovaTech UK', fee: '£40k', mediaValue: '£70k', ratio: 1.8 },
    { sponsor: 'Kestrel Finance', fee: '£85k', mediaValue: '£120k', ratio: 1.4 },
    { sponsor: 'Meridian Insurance', fee: '£95k', mediaValue: '£95k', ratio: 1.0 },
  ],
}

export default function WomensSponsorActivationView() {
  return <SponsorActivationView accent="#BE185D" profile={WOMENS} />
}
