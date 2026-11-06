'use client'

// HQ Equipment & Kit — mapped from the tennis coach Equipment module:
// stat tiles, restock list with tick-to-order, grab-and-go kit checklists,
// and the full inventory by category. Ten Project twist: welcome-pack stock
// (T-shirts, balls, booklets, stickers, certificates) tracked like court kit.

import React from 'react'
import { Package, Printer } from 'lucide-react'
import { Card, SectionTitle, Pill, EmptyState } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { shell, brandHeader, esc, openDocWindow, foot } from '../_lib/funder-docs'
import { useImpact, type ImpactPortalContext } from './ImpactDataContext'
import PackStockPanel from './PackStockPanel'
import BookletPdfCard from './BookletPdfCard'

const STATUS_PILL: Record<string, { tone: 'green' | 'amber' | 'red' | 'grey'; label: string }> = {
  'in-stock': { tone: 'green', label: 'IN STOCK' },
  'running-low': { tone: 'amber', label: 'RUNNING LOW' },
  'to-order': { tone: 'red', label: 'TO ORDER' },
  'repair': { tone: 'red', label: 'REPAIR' },
}

function printKitList(ctx: ImpactPortalContext) {
  const { TP_KITS } = ctx.data
  const b = ctx.brand
  const body = `
    ${brandHeader(ctx, 'KIT LIST')}
    <h1>${esc(b.org)} — kit checklists</h1>
    <div class="sub">Grab-and-go lists per session type · print one per kit bag</div>
    ${TP_KITS.map(k => `<h2>${esc(k.name.toUpperCase())}</h2><ul>${k.items.map(i => `<li style="margin-bottom:5px">☐&nbsp; ${esc(i)}</li>`).join('')}</ul>`).join('')}
    <div class="foot">${esc(b.legal)} · ${foot(ctx, '')}</div>
  `
  openDocWindow(shell(ctx, `${b.org} — Kit List`, body))
}

export default function EquipmentTab() {
  const ctx = useImpact()
  const { TP_EQUIP_STATS, TP_KITS, TP_INVENTORY } = ctx.data

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {ctx.mode !== 'live' && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -50, marginBottom: 4, position: 'relative', zIndex: 1 }}>
        <button onClick={() => printKitList(ctx)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <Printer size={14} /> Print kit list
        </button>
      </div>}

      <BookletPdfCard printKit />
      <PackStockPanel />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {TP_EQUIP_STATS.map(s => (
          <Card key={s.label} style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#8A847E', letterSpacing: 0.8 }}>{s.label}</div>
            <div style={{ fontSize: 23, fontWeight: 900, color: s.label === 'NEED ATTENTION' ? TP_RED : TP_DARK, marginTop: 3 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Kits */}
      <Card>
        <SectionTitle sub="Grab-and-go checklists — one per session type">Kit for each session type</SectionTitle>
        {TP_KITS.length === 0 && <EmptyState compact icon={Package} title="No kit lists yet" sub="Grab-and-go checklists per session type — in-school, weekend family, welcome pack, festival." />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
          {TP_KITS.map(k => (
            <div key={k.name} style={{ background: '#F7F5F2', borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK, marginBottom: 8 }}>
                <Package size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} />{k.name}
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {k.items.map(i => <div key={i} style={{ fontSize: 11.5, color: '#5B554F' }}>• {i}</div>)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Inventory */}
      {TP_INVENTORY.length === 0 && <Card><SectionTitle>Inventory</SectionTitle><EmptyState compact icon={Package} title="No equipment tracked yet" sub="Rackets, balls, court kit, print stock and first-aid — by venue, with stock levels and repair status." /></Card>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {TP_INVENTORY.map(cat => (
          <Card key={cat.category}>
            <SectionTitle>{cat.category}</SectionTitle>
            <div style={{ display: 'grid', gap: 8 }}>
              {cat.items.map(i => (
                <div key={i.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: '#F7F5F2', borderRadius: 9, padding: '9px 11px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK }}>{i.name}</div>
                    <div style={{ fontSize: 10, color: '#8A847E', marginTop: 2 }}>{i.where}</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: TP_DARK, flexShrink: 0 }}>{i.qty}</span>
                  <Pill tone={STATUS_PILL[i.status].tone}>{STATUS_PILL[i.status].label}</Pill>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
