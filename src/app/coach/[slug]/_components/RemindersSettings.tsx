'use client'

// Settings → Reminders & summaries.
//
// What Lumio sends to families on the coach's behalf, and when:
//   • the day-before reminder ("See you at 10am tomorrow… confirmed and paid")
//   • the weather in it, and the coach's own limits for a rain warning
//   • lesson summaries: shared by hand, sent the moment they are approved, or
//     sent at a set time in the evening
// Saves as it goes, like the rest of Settings. The example underneath is
// built by the same code the emails are (reminderMessage).

import type { CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachSettings } from '../_lib/use-settings'
import { setSettings } from '../_lib/settings-store'
import { readReminders, readSummaries, reminderMessage, type ReminderSettings, type SummarySettings } from '@/lib/coach/reminders'
import { WEATHER_CREDIT } from '@/lib/coach/weather'

const TIMES = ['16:00', '17:00', '18:00', '19:00', '20:00']
const EVENING = ['19:00', '20:00', '21:00', '22:00']

export function RemindersSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  const r = readReminders(s.reminders)
  const sm = readSummaries(s.summaries)
  const saveR = (patch: Partial<ReminderSettings>) => setSettings({ reminders: { ...r, ...patch } })
  const saveS = (patch: Partial<SummarySettings>) => setSettings({ summaries: { ...sm, ...patch } })

  const field: CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 9px', fontSize: 12.5, fontFamily: FONT, outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, marginBottom: 4 }
  const h: CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.text }
  const hint: CSSProperties = { fontSize: 11.5, color: T.text3, lineHeight: 1.5 }

  const Switch = ({ id, on, onChange, title, desc }: { id: string; on: boolean; onChange: (v: boolean) => void; title: string; desc: string }) => (
    <label htmlFor={id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : T.panel2, borderRadius: 10, cursor: 'pointer' }}>
      <input id={id} type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: accent.hex }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.text }}>{title}</span>
        <span style={{ display: 'block', ...hint, marginTop: 2 }}>{desc}</span>
      </span>
    </label>
  )

  const example = reminderMessage({
    hello: 'Hi Jo,', childFirst: 'Sam', academy: s.academy || 'Your academy', coachName: s.coach || null,
    time: '10:00', durMin: 60, type: 'Private', venue: 'the club', court: null, paid: true,
    weather: r.weather ? { tempC: 14, windMph: 8, gustMph: 15, rainPct: 10, words: 'dry and mild, 14°C', bad: false, why: [] } : null,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: FONT }}>
      <div style={h}>The day before a lesson</div>
      <Switch id="rem-day" on={r.dayBefore} onChange={v => saveR({ dayBefore: v })}
        title="Email a reminder the day before"
        desc="To the parent for a junior, or the player. It tells them the time and place, the forecast and that the lesson is confirmed (and paid, when it is). It is information, not a question, and it is also filed in their messages in the app." />
      {r.dayBefore && (
        <label style={{ maxWidth: 220 }}><span style={lbl}>Send it at</span>
          <select value={r.at} onChange={e => saveR({ at: e.target.value })} style={field}>
            {Array.from(new Set([...TIMES, r.at])).sort().map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      )}
      {r.dayBefore && (
        <div data-testid="reminder-example" style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ ...lbl, marginBottom: 6 }}>What a parent receives</div>
          <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{example.text}</div>
        </div>
      )}

      <div style={{ ...h, marginTop: 6 }}>The weather</div>
      <Switch id="rem-wx" on={r.weather} onChange={v => saveR({ weather: v })}
        title="Use the forecast"
        desc="Put the forecast in reminders, and warn you on your dashboard when a lesson today or tomorrow crosses your limits, with a one-tap rain-off that cancels, refunds and tells everyone." />
      {r.weather && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          <label><span style={lbl}>Warn me when rain is</span>
            <select value={r.rainPct} onChange={e => saveR({ rainPct: Number(e.target.value) })} style={field}>
              {[40, 50, 60, 70, 80].map(v => <option key={v} value={v}>{v}% likely or more</option>)}
              {![40, 50, 60, 70, 80].includes(r.rainPct) && <option value={r.rainPct}>{r.rainPct}% likely or more</option>}
            </select>
          </label>
          <label><span style={lbl}>Or the wind reaches</span>
            <select value={r.windMph} onChange={e => saveR({ windMph: Number(e.target.value) })} style={field}>
              {[15, 20, 25, 30, 35].map(v => <option key={v} value={v}>{v}mph</option>)}
              {![15, 20, 25, 30, 35].includes(r.windMph) && <option value={r.windMph}>{r.windMph}mph</option>}
            </select>
          </label>
        </div>
      )}
      {r.weather && <div style={hint}>Forecasts are found from the postcode in each venue’s address (Venues &amp; courts). {WEATHER_CREDIT}.</div>}

      <div style={{ ...h, marginTop: 6 }}>Lesson summaries</div>
      <div style={hint}>When you approve a summary with “Send to family” on the Lessons page:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {([
          ['manual', 'I’ll share them myself', 'Copy, email from your mail app, or WhatsApp, as now.'],
          ['now', 'Send it straight away', 'Lumio emails it the moment you approve it.'],
          ['time', 'Send it in the evening', 'Approved summaries go out together at the time you choose, so families get them after the day is done.'],
        ] as const).map(([k, t, d]) => (
          <label key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 12px', border: `1px solid ${sm.send === k ? accent.border : T.border}`, background: sm.send === k ? accent.dim : T.panel2, borderRadius: 10, cursor: 'pointer' }}>
            <input type="radio" name="sum-send" checked={sm.send === k} onChange={() => saveS({ send: k })} style={{ marginTop: 2, accentColor: accent.hex }} />
            <span><span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.text }}>{t}</span><span style={{ display: 'block', ...hint }}>{d}</span></span>
          </label>
        ))}
      </div>
      {sm.send === 'time' && (
        <label style={{ maxWidth: 220 }}><span style={lbl}>Send them at</span>
          <select value={sm.at} onChange={e => saveS({ at: e.target.value })} style={field}>
            {Array.from(new Set([...EVENING, sm.at])).sort().map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      )}
      <div style={hint}>Your private coach note is never included. Emails go from your own mailbox when one is connected (Connected accounts), otherwise from Lumio with replies coming to you.</div>
    </div>
  )
}
