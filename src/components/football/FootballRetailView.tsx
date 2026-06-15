'use client'

import RetailMerchandiseView, { type RetailProfile } from '@/components/commercial/RetailMerchandiseView'

const MENS: RetailProfile = {
  kpis: [
    { label: 'Retail revenue', value: '£4.8m', sub: 'season to date', color: '#F9FAFB' },
    { label: 'Online share', value: '62%', sub: 'of retail sales', color: '#60A5FA' },
    { label: 'Avg basket', value: '£48', sub: '+£4 YoY', color: '#22C55E' },
    { label: 'Gross margin', value: '54%', sub: 'blended', color: '#F1C40F' },
  ],
  channels: [
    { name: 'Online store', revenue: '£2.98m', pct: 62, trend: '+18%' },
    { name: 'Club shop — matchday', revenue: '£1.10m', pct: 23, trend: '+6%' },
    { name: 'Club shop — non-match', revenue: '£0.72m', pct: 15, trend: '+3%' },
  ],
  topSkus: [
    { product: 'Home shirt 2025/26', units: '18,400', revenue: '£1.47m', margin: 52, stock: 'In stock' },
    { product: 'Away shirt 2025/26', units: '9,200', revenue: '£0.74m', margin: 52, stock: 'In stock' },
    { product: 'Training range', units: '12,000', revenue: '£0.60m', margin: 58, stock: 'In stock' },
    { product: 'Retro 1990 shirt', units: '3,400', revenue: '£0.27m', margin: 60, stock: 'Low' },
    { product: 'Scarves & accessories', units: '22,000', revenue: '£0.33m', margin: 64, stock: 'In stock' },
    { product: 'Signed memorabilia', units: '480', revenue: '£0.12m', margin: 70, stock: 'Low' },
  ],
  stock: [
    { label: 'Stock value (cost)', value: '£1.2m' }, { label: 'Active SKUs', value: '640' },
    { label: 'Low-stock alerts', value: '14' }, { label: 'Sell-through rate', value: '78%' },
  ],
  kitLaunch: [
    { label: 'Launch-week sales', value: '£620k' }, { label: 'Pre-orders', value: '8,400' },
    { label: 'Units sold day 1', value: '5,200' }, { label: 'vs last launch', value: '+22%' },
  ],
}

export default function FootballRetailView() {
  return <RetailMerchandiseView accent="#003DA5" profile={MENS} />
}
