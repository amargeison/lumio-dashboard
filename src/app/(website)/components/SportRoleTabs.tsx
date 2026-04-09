'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'

export interface SportRole {
  id: string
  label: string
  icon: string
  description: string
  modules: { name: string; detail: string }[]
  integrations: string[]
  whatYouGet: string[]
}

export interface SportRoleTabsProps {
  sport: string
  demoHref: string
  accentColor: string
  accentColorDim: string
  roles: SportRole[]
}

export default function SportRoleTabs({ sport, demoHref, accentColor, accentColorDim, roles }: SportRoleTabsProps) {
  const [activeId, setActiveId] = useState(roles[0]?.id ?? '')
  const [openModule, setOpenModule] = useState<number | null>(null)
  const active = roles.find(r => r.id === activeId) ?? roles[0]

  if (!active) return null

  return (
    <section className="px-6 md:px-12 lg:px-20 py-20" style={{ backgroundColor: '#0d0f1a' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accentColor }}>
            YOUR TEAM
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: '#F9FAFB', lineHeight: 1.1 }}>
            Purpose-built for every role.
          </h2>
          <p className="text-base md:text-lg max-w-2xl" style={{ color: '#9CA3AF' }}>
            Whether you&apos;re in the boardroom or on the touchline — everyone on your team gets the tools built for their job.
          </p>
        </div>

        {/* Tabs row */}
        <div className="overflow-x-auto pb-2 mb-6 -mx-1">
          <div className="flex gap-2 px-1 min-w-max">
            {roles.map(r => {
              const isActive = r.id === activeId
              return (
                <button
                  key={r.id}
                  onClick={() => { setActiveId(r.id); setOpenModule(null) }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: isActive ? accentColor : '#111318',
                    color: isActive ? '#FFFFFF' : '#9CA3AF',
                    border: `1px solid ${isActive ? accentColor : '#1F2937'}`,
                  }}
                >
                  <span className="text-base leading-none">{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Two-column content card */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[45%_55%]">
            {/* LEFT PANEL */}
            <div className="p-6 md:p-8" style={{ borderBottom: '1px solid #1F2937' }}>
              <h3 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#F9FAFB' }}>
                {active.label}
              </h3>
              <div
                className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-4"
                style={{ backgroundColor: accentColorDim, color: accentColor }}
              >
                {active.modules.length} modules included
              </div>
              <p className="text-sm md:text-base mb-6" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>
                {active.description}
              </p>

              <div className="flex flex-col gap-2">
                {active.modules.map((m, i) => {
                  const isOpen = openModule === i
                  return (
                    <button
                      key={i}
                      onClick={() => setOpenModule(isOpen ? null : i)}
                      className="text-left rounded-lg transition-colors"
                      style={{ backgroundColor: '#0d0f1a', border: '1px solid #1F2937' }}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <ChevronRight
                          size={16}
                          style={{
                            color: isOpen ? accentColor : '#6B7280',
                            transform: isOpen ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.15s ease',
                            flexShrink: 0,
                          }}
                        />
                        <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
                          {m.name}
                        </span>
                      </div>
                      {isOpen && (
                        <div className="px-3 pb-3 pl-10 text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                          {m.detail}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="p-6 md:p-8" style={{ backgroundColor: '#0a0c14' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>
                KEY INTEGRATIONS FOR {active.label.toUpperCase()}
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {active.integrations.map(i => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #374151' }}
                  >
                    {i}
                  </span>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #1F2937', marginBottom: 24 }} />

              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>
                WHAT YOU GET
              </div>
              <ul className="flex flex-col gap-2.5 mb-6">
                {active.whatYouGet.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#D1D5DB', lineHeight: 1.5 }}>
                    <Check size={16} style={{ color: '#22C55E', flexShrink: 0, marginTop: 2 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={demoHref}
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor, color: '#FFFFFF' }}
              >
                See {sport} live in a demo →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
