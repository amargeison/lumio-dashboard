'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const NOTIFICATIONS = [
  { id: '1', type: 'urgent', icon: '🔴', title: 'Invoice overdue', body: 'INV-2026-041 from Tom Wright is 14 days overdue (£3,200)', time: '8 mins ago', read: false },
  { id: '2', type: 'deal', icon: '💰', title: 'Deal moved to Negotiation', body: 'Apex Consulting (£24,000) moved by Charlotte Davies', time: '32 mins ago', read: false },
  { id: '3', type: 'workflow', icon: '⚡', title: 'Workflow completed', body: 'HR-01 New Joiner onboarding completed for Sophie Williams', time: '1 hour ago', read: false },
  { id: '4', type: 'trial', icon: '🎯', title: 'New trial signup', body: 'Just Wow Inc signed up for a 14-day Starter trial', time: '2 hours ago', read: true },
  { id: '5', type: 'payment', icon: '✅', title: 'Payment received', body: 'Stripe confirmed £4,800 from Oakridge Schools Ltd', time: '3 hours ago', read: true },
  { id: '6', type: 'meeting', icon: '📅', title: 'Meeting in 15 minutes', body: 'New Customer Demo with Sarah Chen — starting soon', time: 'Today 9:00am', read: true },
  { id: '7', type: 'ai', icon: '🤖', title: 'ARIA insight', body: 'Pipeline health dropped 8% this week — 2 deals need attention', time: 'Yesterday', read: true },
]

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState(NOTIFICATIONS)
  const unreadCount = items.filter(n => !n.read).length

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[79]" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-[80] flex flex-col"
        style={{ width: 380, backgroundColor: '#111318', borderLeft: '1px solid #1F2937', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium" style={{ color: '#0D9488' }}>
                Mark all read
              </button>
            )}
            <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {items.map(n => (
            <div
              key={n.id}
              className="px-5 py-4"
              style={{
                borderBottom: '1px solid #1F2937',
                borderLeft: n.read ? 'none' : '3px solid #0D9488',
                backgroundColor: n.read ? 'transparent' : 'rgba(13,148,136,0.04)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: '#1F2937' }}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate" style={{ color: n.read ? '#9CA3AF' : '#F9FAFB' }}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#0D9488' }} />}
                  </div>
                  <p className="text-xs mb-1 leading-relaxed" style={{ color: '#6B7280' }}>{n.body}</p>
                  <p className="text-xs" style={{ color: '#4B5563' }}>{n.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
