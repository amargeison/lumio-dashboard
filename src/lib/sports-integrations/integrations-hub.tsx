'use client'
import React, { useState } from 'react'
import { IntegrationDetailCard, type IntegrationConfig } from './integration-detail-view'

export type HubEntry = {
  id: string
  icon: string
  label: string
  category?: string
  connected?: boolean
} & (
  | { kind: 'generic'; config: IntegrationConfig }
  | { kind: 'custom'; render: () => React.ReactNode }
)

const CATEGORY_ORDER = [
  'Data Feeds',
  'Hardware Sensors',
  'Wearables',
  'Compliance',
  'Team Tools',
  'Distribution',
  'Other',
]

export function IntegrationsHub({ entries, accent }: { entries: HubEntry[]; accent?: string }) {
  const accentVar = accent ?? 'var(--brand-primary, #16a34a)'
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? '')
  const active = entries.find(e => e.id === activeId) ?? entries[0]

  const grouped: Record<string, HubEntry[]> = {}
  for (const e of entries) {
    const cat = e.category ?? 'Other'
    ;(grouped[cat] ??= []).push(e)
  }
  const orderedCats = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a)
    const bi = CATEGORY_ORDER.indexOf(b)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  return (
    <div className="space-y-4">
      <div className="mb-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔌</span>
          <h2 className="text-xl font-bold text-white">Integrations</h2>
        </div>
        <p className="text-sm text-gray-400 mt-1 ml-7">
          Hardware sensors, data feeds, and team tools — connect what you use.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <aside className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-2 md:max-h-[80vh] overflow-y-auto">
          <nav>
            {orderedCats.map((cat, ci) => (
              <div key={cat} className={ci > 0 ? 'mt-3' : ''}>
                <div className="text-[10px] uppercase tracking-wider text-gray-600 px-3 py-1.5">
                  {cat}
                </div>
                <div className="space-y-0.5">
                  {grouped[cat].map(e => {
                    const isActive = activeId === e.id
                    return (
                      <button
                        key={e.id}
                        onClick={() => setActiveId(e.id)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
                        style={{
                          background: isActive
                            ? `color-mix(in srgb, ${accentVar} 15%, transparent)`
                            : 'transparent',
                          color: isActive ? '#fff' : '#9CA3AF',
                          border: `1px solid ${isActive ? `color-mix(in srgb, ${accentVar} 35%, transparent)` : 'transparent'}`,
                        }}
                      >
                        <span className="text-base flex-shrink-0">{e.icon}</span>
                        <span className="truncate">{e.label}</span>
                        {e.connected && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {active &&
            (active.kind === 'generic'
              ? <IntegrationDetailCard config={active.config} />
              : active.render())}
        </div>
      </div>
    </div>
  )
}
