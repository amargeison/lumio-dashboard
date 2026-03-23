'use client'

import { useState, useEffect } from 'react'

interface NotToMissItem {
  id: string
  urgency: 'critical' | 'today' | 'soon'
  title: string
  body: string
  deadline?: string
  consequence?: string
  action: string
  actionUrl?: string
  category: string
  dismissed: boolean
}

const URGENCY = {
  critical: { bg: 'rgba(153,27,27,0.15)',  border: 'rgba(239,68,68,0.35)',   tagBg: '#DC2626', label: '🔴 CRITICAL' },
  today:    { bg: 'rgba(120,53,15,0.12)',   border: 'rgba(245,158,11,0.25)',  tagBg: '#D97706', label: '🟡 TODAY'    },
  soon:     { bg: 'rgba(29,78,216,0.08)',   border: 'rgba(59,130,246,0.2)',   tagBg: '#2563EB', label: '🔵 SOON'     },
}

const MOCK_ITEMS: NotToMissItem[] = [
  { id: '1', urgency: 'critical', title: 'Stripe is still in TEST MODE', body: 'You have paying customers but Stripe is not live. Any payments will be rejected silently. Switch to live mode before The Feed Network signs up.', deadline: 'Before first invoice', consequence: 'Payments will silently fail', action: 'Switch Stripe live', actionUrl: 'https://dashboard.stripe.com/settings/account', category: 'Finance', dismissed: false },
  { id: '2', urgency: 'critical', title: 'Company not yet registered', body: 'You cannot legally sign customer contracts, hold IP, or accept money as an unregistered entity. Takes 24 hours and costs £12 at Companies House.', deadline: 'Before any contract signing', consequence: 'Contracts are unenforceable', action: 'Register at Companies House', actionUrl: 'https://www.gov.uk/limited-company-formation', category: 'Legal', dismissed: false },
  { id: '3', urgency: 'today', title: 'The Feed Network go-live is imminent', body: 'Testing guide has 13 flagged gaps. 6 phases need sign-off. Go-live is blocked until this is complete.', deadline: 'This week', consequence: 'Delays first revenue', action: 'Open testing guide', category: 'Operations', dismissed: false },
  { id: '4', urgency: 'today', title: 'Update Calendly link in the website nav', body: 'The "Book a Demo" button links to a placeholder. Every visitor who tries to book a demo hits a broken link.', deadline: 'Today', consequence: 'Lost demo bookings', action: 'Update in code', category: 'Marketing', dismissed: false },
  { id: '5', urgency: 'soon', title: 'Trademark "Lumio" before you scale marketing', body: 'IPO Class 42 registration. Check for conflicts first — there is a US edtech company called Lumio. UK trademark costs £170.', deadline: 'Before major marketing push', consequence: 'Brand protection risk', action: 'Search IPO register', actionUrl: 'https://trademarks.ipo.gov.uk/ipo-tmcase/page/Results/1/', category: 'Legal', dismissed: false },
]

export default function NotToMiss() {
  const [items, setItems] = useState<NotToMissItem[]>([])

  useEffect(() => {
    fetch('/api/home/not-to-miss')
      .then(r => r.json())
      .then(d => setItems(d.items || MOCK_ITEMS))
      .catch(() => setItems(MOCK_ITEMS))
  }, [])

  const dismiss = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, dismissed: true } : i))
  const active = items.filter(i => !i.dismissed)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>🔴 Don&apos;t Miss Today</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Critical items that need your attention — sorted by urgency</p>
        </div>
        <div className="text-sm" style={{ color: '#6B7280' }}>{active.length} items</div>
      </div>

      <div className="space-y-3">
        {active.map(item => {
          const u = URGENCY[item.urgency]
          return (
            <div key={item.id} className="rounded-2xl p-5"
              style={{ backgroundColor: u.bg, border: `1px solid ${u.border}` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: u.tagBg }}>{u.label}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{item.category}</span>
                    {item.deadline && <span className="text-xs" style={{ color: '#6B7280' }}>Deadline: {item.deadline}</span>}
                  </div>
                  <h3 className="font-bold mb-1.5" style={{ color: '#F9FAFB' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: '#9CA3AF' }}>{item.body}</p>
                  {item.consequence && (
                    <p className="text-xs" style={{ color: 'rgba(248,113,113,0.8)' }}>⚠️ If not done: {item.consequence}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {item.actionUrl ? (
                    <a href={item.actionUrl} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap text-center"
                      style={{ backgroundColor: '#7C3AED' }}>
                      {item.action} →
                    </a>
                  ) : (
                    <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                      style={{ backgroundColor: '#7C3AED' }}>
                      {item.action} →
                    </button>
                  )}
                  <button onClick={() => dismiss(item.id)}
                    className="px-4 py-2 text-xs rounded-xl transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {active.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Nothing critical today!</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>All urgent items are handled.</p>
          </div>
        )}
      </div>
    </div>
  )
}
