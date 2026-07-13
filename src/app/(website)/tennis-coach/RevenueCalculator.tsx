'use client'

import { useState } from 'react'

// Palette mirrors tennis-coach/page.tsx ("Ocean" accent — the coach portal's blue
// preset). The standalone prototype was teal; the live page is Ocean, so this
// section follows the live page so it reads native rather than bolted-on.
const PURPLE = '#1F6FCC'        // primary (buttons, shadows)
const PURPLE_LIGHT = '#3A8EE0'  // accent (values, highlights)
const CARD = '#0D1117'
const BORDER = '#1E293B'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')

type Period = 'month' | 'year'

function Slider({
  id, label, value, min, max, step, display, hint, onChange,
}: {
  id: string; label: string; value: number; min: number; max: number; step: number
  display: string; hint: string; onChange: (v: number) => void
}) {
  return (
    <div className="roi-field">
      <label htmlFor={id} className="roi-lbl">
        <span>{label}</span>
        <span className="roi-val">{display}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={display}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div className="roi-hint">{hint}</div>
    </div>
  )
}

export default function RevenueCalculator() {
  const [period, setPeriod] = useState<Period>('month')

  // Stream 1 — Racket rewards
  const [players, setPlayers] = useState(40)
  const [stages, setStages] = useState(2)
  const [margin, setMargin] = useState(8)

  // Stream 2 — Student app resale
  const [families, setFamilies] = useState(18)
  const [appMargin, setAppMargin] = useState(6)
  const [sub, setSub] = useState(19)

  // Rewards are annual, shown monthly; app income is already monthly.
  const rewardMonth = (players * stages * margin) / 12
  const appMonth = families * appMargin
  const grossMonth = rewardMonth + appMonth
  const netMonth = grossMonth - sub
  const ratio = grossMonth / sub

  const mult = period === 'year' ? 12 : 1
  const per = period === 'year' ? ' / year' : ' / month'

  return (
    <section
      className="lumio-roi"
      style={{ padding: '96px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}
    >
      <style>{`
        .lumio-roi *{box-sizing:border-box}
        .lumio-roi .roi-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:14px}
        .lumio-roi .roi-breakdown{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}
        .lumio-roi .roi-field{margin-bottom:16px}
        .lumio-roi .roi-lbl{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:13.5px;font-weight:700;color:${TEXT};margin-bottom:9px}
        .lumio-roi .roi-val{color:${PURPLE_LIGHT};font-weight:800;font-variant-numeric:tabular-nums;flex-shrink:0}
        .lumio-roi .roi-hint{font-size:11.5px;color:#64748B;margin-top:7px;line-height:1.45}
        .lumio-roi input[type=range]{width:100%;-webkit-appearance:none;appearance:none;height:6px;border-radius:6px;background:#1F2937;outline:none;cursor:pointer}
        .lumio-roi input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${PURPLE_LIGHT};cursor:pointer;box-shadow:0 2px 6px rgba(31,111,204,.6);border:3px solid ${CARD}}
        .lumio-roi input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${PURPLE_LIGHT};cursor:pointer;border:3px solid ${CARD}}
        .lumio-roi input[type=range]:focus-visible{outline:2px solid ${PURPLE_LIGHT};outline-offset:4px}
        .lumio-roi input[type=range]:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px rgba(58,142,224,.35)}
        .lumio-roi .roi-pill:focus-visible,.lumio-roi .roi-cta:focus-visible{outline:2px solid ${PURPLE_LIGHT};outline-offset:3px}
        .lumio-roi .roi-cta{transition:background-color .15s ease}
        .lumio-roi .roi-cta:hover{background-color:${PURPLE_LIGHT}}
        @media(max-width:820px){.lumio-roi .roi-grid{grid-template-columns:1fr}}
        @media(max-width:560px){.lumio-roi .roi-breakdown{grid-template-columns:1fr}}
      `}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: PURPLE_LIGHT, textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
          💸 Two revenue streams
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
          What could two revenue streams add to your coaching?
        </h2>
        <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', maxWidth: 720, margin: '0 auto', lineHeight: 1.6 }}>
          Lumio doesn&apos;t just run your week — it pays you back. Move the sliders to see the extra income you&apos;d control from the Racket Progression reward kit and reselling the Student app to your families.
        </p>

        {/* Month / Year toggle */}
        <div role="group" aria-label="Show figures per month or per year" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 22 }}>
          {(['month', 'year'] as Period[]).map(p => {
            const on = period === p
            return (
              <button
                key={p}
                type="button"
                className="roi-pill"
                aria-pressed={on}
                onClick={() => setPeriod(p)}
                style={{
                  border: `1px solid ${on ? PURPLE : BORDER}`,
                  backgroundColor: on ? PURPLE : 'transparent',
                  color: on ? '#fff' : MUTED,
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '8px 18px',
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
              >
                {p === 'month' ? 'Per month' : 'Per year'}
              </button>
            )
          })}
        </div>

        {/* Two stream cards */}
        <div className="roi-grid">
          {/* Stream 1 — Racket rewards */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, boxShadow: `0 20px 50px ${PURPLE}14` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Stream 1 — Racket rewards
            </div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, marginBottom: 18 }}>
              You award a coloured racket keyring + dampener + certificate as players climb the 9 stages. Parents fund the journey; you keep the margin on every set.
            </p>

            <Slider id="roi-players" label="Players in your programme" value={players} min={5} max={300} step={5}
              display={String(players)} hint="Across private, squads and groups." onChange={setPlayers} />
            <Slider id="roi-stages" label="Stages awarded per player / year" value={stages} min={1} max={9} step={1}
              display={String(stages)} hint="9 stages total (White → Black). Most players earn 1–3 a year." onChange={setStages} />
            <Slider id="roi-margin" label="Your margin per award (£)" value={margin} min={3} max={20} step={1}
              display={'£' + margin} hint="A set of 9 costs you ~£50 (~£5.50 each). You set the price." onChange={setMargin} />

            <div style={{ marginTop: 4, paddingTop: 14, borderTop: `1px dashed ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12.5, color: MUTED }}>Reward income</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: TEXT, fontVariantNumeric: 'tabular-nums' }}>{gbp(rewardMonth * mult)}</span>
            </div>
          </div>

          {/* Stream 2 — Student app resale */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, boxShadow: `0 20px 50px ${PURPLE}14` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Stream 2 — Student app resale
            </div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, marginBottom: 18 }}>
              Give families the player &amp; parent view of everything you capture — highlights, progress, homework. Resell it as recurring margin you keep.
            </p>

            <Slider id="roi-families" label="Families on the Student app" value={families} min={0} max={200} step={1}
              display={String(families)} hint="Usually a share of your players' families — start with your keenest." onChange={setFamilies} />
            <Slider id="roi-appmargin" label="Your margin per family / month (£)" value={appMargin} min={2} max={15} step={1}
              display={'£' + appMargin} hint="Suggested price £9.99/family — you set it and keep the margin, not Lumio." onChange={setAppMargin} />
            <Slider id="roi-sub" label="Your Lumio subscription (£/mo)" value={sub} min={19} max={59} step={10}
              display={'£' + sub} hint="Essential £19 · Pro Lite £29 · Pro £39 · Elite £59." onChange={setSub} />

            <div style={{ marginTop: 4, paddingTop: 14, borderTop: `1px dashed ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12.5, color: MUTED }}>App income</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: TEXT, fontVariantNumeric: 'tabular-nums' }}>{gbp(appMonth * mult)}</span>
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div style={{ marginTop: 22, background: `linear-gradient(150deg, #0F172A, #0a2a4d)`, border: `1px solid ${PURPLE}30`, borderRadius: 22, padding: 32, textAlign: 'center', boxShadow: `0 18px 44px ${PURPLE}33` }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: PURPLE_LIGHT }}>
            Extra income you&apos;d control
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', margin: '6px 0 2px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>
            {gbp(grossMonth * mult)}
            <span style={{ fontSize: 22, fontWeight: 700, color: '#94A3B8' }}>{per}</span>
          </div>
          <div style={{ fontSize: 14, color: '#94A3B8' }}>
            on top of your lesson income — from streams built into the product
          </div>

          <div className="roi-breakdown">
            {[
              { n: gbp(rewardMonth * mult), l: 'Racket rewards' },
              { n: gbp(appMonth * mult), l: 'Student app resale' },
              { n: '–' + gbp(sub * mult), l: 'Less Lumio subscription' },
            ].map(b => (
              <div key={b.l} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: PURPLE_LIGHT, fontVariantNumeric: 'tabular-nums' }}>{b.n}</div>
                <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 3 }}>{b.l}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, fontSize: 13.5, color: '#a7c8f0' }}>
            Net after your subscription: <b style={{ color: '#fff' }}>{gbp(netMonth * mult)}</b> {per} —{' '}
            {ratio >= 1
              ? `that's ${ratio.toFixed(1)}× your subscription covered.`
              : 'add a few more families or awards to cover it.'}
          </div>

          <a
            className="roi-cta"
            href="https://lumiosports.com/tennis/coach/demo"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 22, backgroundColor: PURPLE, color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 999 }}
          >
            Try the live demo — free for 3 months →
          </a>
        </div>

        {/* Small print */}
        <p style={{ marginTop: 22, textAlign: 'center', fontSize: 11.5, color: '#64748B', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          Illustrative only. Figures are estimates based on the numbers you enter and Lumio&apos;s published pricing (reorder set of 9 ~£50; suggested Student app £9.99/family; tiers from £19/month). Actual income depends on your own pricing and uptake. Not a guarantee of earnings.
        </p>
      </div>
    </section>
  )
}
