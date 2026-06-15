'use client'

import RetailMerchandiseView, { type RetailProfile } from '@/components/commercial/RetailMerchandiseView'

const WOMENS: RetailProfile = {
  kpis: [
    { label: 'Retail revenue', value: '£340k', sub: 'season to date', color: '#F9FAFB' },
    { label: 'Online share', value: '58%', sub: 'of retail sales', color: '#F472B6' },
    { label: 'Avg basket', value: '£36', sub: '+£5 YoY', color: '#22C55E' },
    { label: 'Gross margin', value: '56%', sub: 'blended', color: '#EC4899' },
  ],
  channels: [
    { name: 'Online store', revenue: '£197k', pct: 58, trend: '+26%' },
    { name: 'Club shop — matchday', revenue: '£98k', pct: 29, trend: '+12%' },
    { name: 'Pop-up & events', revenue: '£45k', pct: 13, trend: '+8%' },
  ],
  topSkus: [
    { product: 'Home shirt 2025/26', units: '4,200', revenue: '£252k', margin: 52, stock: 'In stock' },
    { product: 'Away shirt 2025/26', units: '1,900', revenue: '£114k', margin: 52, stock: 'In stock' },
    { product: 'Training range', units: '2,600', revenue: '£104k', margin: 58, stock: 'In stock' },
    { product: 'Scarves & accessories', units: '6,400', revenue: '£64k', margin: 64, stock: 'In stock' },
    { product: 'Community / charity shirt', units: '1,200', revenue: '£48k', margin: 55, stock: 'Low' },
    { product: 'Signed memorabilia', units: '140', revenue: '£21k', margin: 70, stock: 'Low' },
  ],
  stock: [
    { label: 'Stock value (cost)', value: '£140k' }, { label: 'Active SKUs', value: '220' },
    { label: 'Low-stock alerts', value: '6' }, { label: 'Sell-through rate', value: '81%' },
  ],
  kitLaunch: [
    { label: 'Launch-week sales', value: '£58k' }, { label: 'Pre-orders', value: '1,900' },
    { label: 'Units sold day 1', value: '1,100' }, { label: 'vs last launch', value: '+31%' },
  ],
}

export default function WomensRetailView() {
  return <RetailMerchandiseView accent="#BE185D" profile={WOMENS} />
}
