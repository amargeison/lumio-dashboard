'use client'
import React, { useState } from 'react'
import { Activity, Calendar, TrendingUp, Satellite, Video, Utensils, Brain, Zap, ChevronRight } from 'lucide-react'
import type { SportsDemoSession } from '@/components/sports-demo'
import type { MobileTennisPlayerLike } from './MobileTennisHome'
import { ComingSoonModal } from './ComingSoonModal'

export type MobileTrainingHomeProps = {
  session: SportsDemoSession
  player: MobileTennisPlayerLike
  onNavigate: (sectionId: string) => void
}

/**
 * Tennis Training tab — mobile hub.
 *
 * Eight stacked cards, scrollable, sourced from the same demo constants the
 * desktop portal uses (Recovery 82/100 + 68ms + 48bpm + 7.2hrs come from the
 * Physio & Recovery view; the rest mirror the language of the corresponding
 * desktop sections). Tapping any card deep-links into the matching section
 * via setActiveSection — most are still desktop-only views, so the mobile
 * fallback wrapper takes over until each gets its own mobile layout.
 *
 * Founder slugs (session.isDemoShell === false, set URL-side by isDemoSlug)
 * see per-card empty states matching the darts-mirror pattern.
 */
export function MobileTrainingHome({ session, player: _player, onNavigate }: MobileTrainingHomeProps) {
  const isDemo = session.isDemoShell !== false
  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null)
  const stub = (label: string) => () => setComingSoonLabel(label)

  return (
    <div className="w-full pb-2">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          Training
        </h1>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          {isDemo ? 'Last practice: Yesterday 16:00 · 78% intensity' : 'Log your first session to start tracking intensity'}
        </p>
      </div>

      <div className="px-4 space-y-3">
        {/* CARD 1 — Recovery (4 stats) */}
        <Card
          icon={<Activity size={16} />}
          title="Recovery"
          subtitle={isDemo ? 'Lumio Wear · today' : 'Connect Lumio Wear to start tracking'}
          accent="rgb(16, 185, 129)"
          onTap={() => onNavigate('physio')}
        >
          {isDemo ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <RecoveryStat label="Recovery"  value="82/100" tint="rgb(16, 185, 129)" />
              <RecoveryStat label="HRV"       value="68ms"   tint="rgb(34, 211, 238)" />
              <RecoveryStat label="Resting"   value="48bpm"  tint="rgb(96, 165, 250)" />
              <RecoveryStat label="Sleep"     value="7.2h"   tint="rgb(196, 181, 253)" />
            </div>
          ) : (
            <EmptyMessage>No recovery data yet — Connect Lumio Wear</EmptyMessage>
          )}
        </Card>

        {/* CARD 2 — Performance */}
        <Card
          icon={<TrendingUp size={16} />}
          title="Performance"
          subtitle={isDemo ? 'Last 5 matches · ATP Tour' : 'Log a match to see trends'}
          accent="rgb(217, 70, 239)"
          onTap={() => onNavigate('performance')}
        >
          {isDemo ? (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <RecoveryStat label="Form"   value="3W–2L"  tint="rgb(16, 185, 129)" />
              <RecoveryStat label="Serve%" value="68% ▲4" tint="rgb(196, 181, 253)" />
              <RecoveryStat label="Last"   value="W 6–3 6–4" tint="rgb(245, 243, 255)" small />
            </div>
          ) : (
            <EmptyMessage>No performance data yet — Log a match</EmptyMessage>
          )}
        </Card>

        {/* CARD 3 — Today's Practice */}
        <Card
          icon={<Calendar size={16} />}
          title="Today's Practice"
          subtitle={isDemo ? '10:00 · Court 3 · Serve patterns' : 'No practice scheduled'}
          accent="rgb(168, 85, 247)"
          onTap={stub('Log Practice')}
        >
          {isDemo ? (
            <Detail rows={[
              { label: 'Coach',  value: 'Marco Bianchi' },
              { label: 'Focus',  value: 'Kick serve to backhand' },
              { label: 'Length', value: '90 min' },
            ]} />
          ) : (
            <EmptyMessage>Add your first practice session to start logging</EmptyMessage>
          )}
        </Card>

        {/* CARD 4 — GPS Session */}
        <Card
          icon={<Satellite size={16} />}
          title="GPS Session"
          subtitle={isDemo ? 'Yesterday · Court 4' : 'Not connected'}
          accent="rgb(34, 211, 238)"
          onTap={() => onNavigate('gps')}
        >
          {isDemo ? (
            <Detail rows={[
              { label: 'Distance', value: '4.2km' },
              { label: 'Sprints',  value: '34' },
              { label: 'Avg HR',   value: '142 bpm' },
            ]} />
          ) : (
            <EmptyMessage>Not connected — Connect Lumio GPS Tracker</EmptyMessage>
          )}
        </Card>

        {/* CARD 5 — Video Review */}
        <Card
          icon={<Video size={16} />}
          title="Video Review"
          subtitle={isDemo ? 'Last clip: Yesterday · Forehand analysis' : 'Upload your first match footage'}
          accent="rgb(96, 165, 250)"
          onTap={() => onNavigate('video')}
        >
          {isDemo ? (
            <Detail rows={[
              { label: 'Library',   value: '47 clips' },
              { label: 'Pending',   value: '23 to review' },
              { label: 'AI tagged', value: 'All clips' },
            ]} />
          ) : (
            <EmptyMessage>No video library yet — Upload match footage to unlock this</EmptyMessage>
          )}
        </Card>

        {/* CARD 6 — Nutrition */}
        <Card
          icon={<Utensils size={16} />}
          title="Nutrition"
          subtitle={isDemo ? 'Match-day plan · today' : 'No nutrition plan yet'}
          accent="rgb(245, 158, 11)"
          onTap={() => onNavigate('nutrition')}
        >
          {isDemo ? (
            <Detail rows={[
              { label: 'Pre-match',   value: 'High-carb @ 10:00' },
              { label: 'Hydration',   value: '2.1L target' },
              { label: 'Supplements', value: '3 scheduled' },
            ]} />
          ) : (
            <EmptyMessage>No nutrition data yet — Connect your plan to unlock this</EmptyMessage>
          )}
        </Card>

        {/* CARD 7 — Mental Performance */}
        <Card
          icon={<Brain size={16} />}
          title="Mental Performance"
          subtitle={isDemo ? 'Next session: tonight 21:00' : 'Add your first session'}
          accent="rgb(196, 181, 253)"
          onTap={() => onNavigate('mental')}
        >
          {isDemo ? (
            <Detail rows={[
              { label: 'Coach',     value: 'Dr. Aisha Patel' },
              { label: 'Format',    value: 'Remote · 60 min' },
              { label: 'Last week', value: '2 sessions logged' },
            ]} />
          ) : (
            <EmptyMessage>No sessions logged — Connect your mental performance coach</EmptyMessage>
          )}
        </Card>

        {/* CARD 8 — Equipment */}
        <Card
          icon={<Zap size={16} />}
          title="Equipment"
          subtitle={isDemo ? 'Active match-day setup' : 'No racket data logged'}
          accent="rgb(252, 211, 77)"
          onTap={() => onNavigate('racket')}
        >
          {isDemo ? (
            <Detail rows={[
              { label: 'Racket',  value: 'Wilson Pro Staff RF97' },
              { label: 'Strings', value: 'Luxilon ALU Power 16L' },
              { label: 'Tension', value: '24kg' },
            ]} />
          ) : (
            <EmptyMessage>No racket data logged — Add your rackets and string log</EmptyMessage>
          )}
        </Card>
      </div>

      {comingSoonLabel && (
        <ComingSoonModal label={comingSoonLabel} onClose={() => setComingSoonLabel(null)} />
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Card({
  icon,
  title,
  subtitle,
  accent,
  children,
  onTap,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  accent: string
  children: React.ReactNode
  onTap: () => void
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left rounded-xl p-3.5 transition-transform active:scale-[0.99]"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(168, 85, 247, 0.15)',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `${accent}1f`,
            color: accent,
            border: `1px solid ${accent}55`,
          }}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </div>
        </div>
        <ChevronRight size={16} className="flex-shrink-0 mt-1" style={{ color: 'var(--text-meta)' }} />
      </div>
      {children}
    </button>
  )
}

function RecoveryStat({ label, value, tint, small }: { label: string; value: string; tint: string; small?: boolean }) {
  return (
    <div
      className="rounded-lg px-2.5 py-2"
      style={{
        background: 'rgba(0, 0, 0, 0.22)',
        border: '1px solid rgba(168, 85, 247, 0.12)',
      }}
    >
      <div
        className="uppercase font-bold"
        style={{
          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
          fontSize: 9,
          letterSpacing: '0.7px',
          color: 'rgba(196, 181, 253, 0.75)',
        }}
      >
        {label}
      </div>
      <div
        className="font-extrabold leading-none mt-1 truncate"
        style={{
          fontSize: small ? 13 : 16,
          color: tint,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Detail({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="mt-3 space-y-1.5">
      {rows.map(r => (
        <div key={r.label} className="flex items-center justify-between text-[11.5px]">
          <span
            className="uppercase"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 9.5,
              letterSpacing: '0.8px',
              color: 'var(--text-muted)',
            }}
          >
            {r.label}
          </span>
          <span className="font-semibold text-right" style={{ color: 'rgba(245, 243, 255, 0.92)' }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-3 rounded-lg px-3 py-3 text-[11.5px] text-center"
      style={{
        background: 'rgba(0, 0, 0, 0.22)',
        border: '1px dashed rgba(168, 85, 247, 0.25)',
        color: 'rgba(196, 181, 253, 0.7)',
      }}
    >
      {children}
    </div>
  )
}
