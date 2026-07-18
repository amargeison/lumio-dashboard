'use client'

// Shared week-view calendar for the School / Coach / TENOR landing tabs.
// Demo of the Gmail / Microsoft 365 sync (maps from the tennis coach portal's
// booking-calendar + MS365 integration — live version reads the same feed).

import React from 'react'
import { CalendarDays, RefreshCw } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, CAL_EVENTS, type CalEvent } from '@/data/tenproject/demo-data'

const DAYS: CalEvent['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const KIND_STYLE: Record<CalEvent['kind'], { bg: string; border: string; fg: string }> = {
  school: { bg: '#F7F5F2', border: '#D9D3CC', fg: TP_DARK },
  weekend: { bg: '#FDE8E8', border: `${TP_RED}55`, fg: TP_RED },
  admin: { bg: '#fff', border: '#E7E2DC', fg: '#5B554F' },
  fundraising: { bg: '#FCF1DC', border: '#E8CD9A', fg: '#9A6A0B' },
}

export default function UpcomingCalendar({ role, events: eventsProp, title, sub }: {
  role?: 'school' | 'coach' | 'tenor'
  events?: CalEvent[]
  title?: string
  sub?: string
}) {
  const events = eventsProp ?? CAL_EVENTS[role ?? 'coach']

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub={sub ?? 'Your week ahead — sessions land in your own calendar automatically'}>
          <CalendarDays size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />{title ?? 'Upcoming sessions'}
        </SectionTitle>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
          <Pill tone="green">✓ SYNCED · GOOGLE CALENDAR</Pill>
          <Pill tone="grey">MICROSOFT 365</Pill>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 8, padding: '6px 11px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            <RefreshCw size={12} /> Sync now
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 6 }}>
        {DAYS.map(day => {
          const dayEvents = events.filter(e => e.day === day).sort((a, b) => a.time.localeCompare(b.time))
          const isWeekend = day === 'Sat' || day === 'Sun'
          return (
            <div key={day} style={{ background: isWeekend ? '#FBF7F2' : '#FAFAF8', border: '1px solid #F0EBE5', borderRadius: 10, padding: '8px 7px', minHeight: 96 }}>
              <div style={{ fontSize: 10.5, fontWeight: 900, color: isWeekend ? TP_RED : '#8A847E', letterSpacing: 0.5, marginBottom: 6 }}>{day.toUpperCase()}</div>
              <div style={{ display: 'grid', gap: 5 }}>
                {dayEvents.map((e, i) => {
                  const st = KIND_STYLE[e.kind]
                  return (
                    <div key={i} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 7, padding: '5px 7px' }}>
                      <div style={{ fontSize: 9.5, fontWeight: 900, color: st.fg }}>{e.time}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TP_DARK, lineHeight: 1.25, marginTop: 1 }}>{e.title}</div>
                      {e.where && <div style={{ fontSize: 8.5, color: '#8A847E', marginTop: 1 }}>{e.where}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: '#8A847E', marginTop: 10 }}>
        Session changes (venue moved, weather-off) update everyone’s calendar and send a scoped message — no more chasing.
      </div>
    </Card>
  )
}
