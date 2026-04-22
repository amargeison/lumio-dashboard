'use client'
import React, { useState } from 'react'
import { Activity, Calendar, TrendingUp, Satellite, Video, Utensils, Brain, Zap, ChevronRight } from 'lucide-react'
import type { SportsDemoSession } from '@/components/sports-demo'
import type { SportMobileConfig } from '@/lib/mobile/types'
import { ComingSoonModal } from './ComingSoonModal'

export type MobileSportTrainingProps = {
  session: SportsDemoSession
  config: SportMobileConfig
  onNavigate: (sectionId: string) => void
}

/**
 * Generic mobile Training hub. Eight stacked cards (Recovery → Performance →
 * Today's Practice → GPS → Video → Nutrition → Mental → Equipment), all driven
 * by `config.training`. Sports without a natural GPS-session equivalent (darts)
 * set `gps: null` to skip that card entirely.
 *
 * Founder slugs (session.isDemoShell === false, set URL-side by isDemoSlug)
 * see per-card empty states matching the darts-mirror pattern.
 */
export function MobileSportTraining({ session, config, onNavigate }: MobileSportTrainingProps) {
  const isDemo = session.isDemoShell !== false
  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null)
  const stub = (label: string) => () => setComingSoonLabel(label)
  const t = config.training

  return (
    <div className="w-full pb-2">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          Training
        </h1>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          {isDemo ? t.headerSubtitle : 'Log your first session to start tracking intensity'}
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
              <RecoveryStat label="Recovery"  value={t.recovery.score}     tint="rgb(16, 185, 129)" />
              <RecoveryStat label="HRV"       value={t.recovery.hrv}       tint="rgb(34, 211, 238)" />
              <RecoveryStat label="Resting"   value={t.recovery.restingHr} tint="rgb(96, 165, 250)" />
              <RecoveryStat label="Sleep"     value={t.recovery.sleep}     tint="rgb(196, 181, 253)" />
            </div>
          ) : (
            <EmptyMessage>No recovery data yet — Connect Lumio Wear</EmptyMessage>
          )}
        </Card>

        {/* CARD 2 — Performance */}
        <Card
          icon={<TrendingUp size={16} />}
          title="Performance"
          subtitle={isDemo ? t.performance.subtitle : 'Log a match to see trends'}
          accent="rgb(217, 70, 239)"
          onTap={() => onNavigate('performance')}
        >
          {isDemo ? (
            <div className={`grid gap-2 mt-3 ${t.performance.stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {t.performance.stats.map((s, i) => (
                <RecoveryStat
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  tint={i === 0 ? 'rgb(16, 185, 129)' : i === 1 ? 'rgb(196, 181, 253)' : 'rgb(245, 243, 255)'}
                  small={i === 2 && s.value.length > 6}
                />
              ))}
            </div>
          ) : (
            <EmptyMessage>No performance data yet — Log a match</EmptyMessage>
          )}
        </Card>

        {/* CARD 3 — Today's Practice */}
        <Card
          icon={<Calendar size={16} />}
          title="Today's Practice"
          subtitle={isDemo ? t.practice.subtitle : 'No practice scheduled'}
          accent="rgb(168, 85, 247)"
          onTap={stub('Log Practice')}
        >
          {isDemo ? (
            <Detail rows={t.practice.rows} />
          ) : (
            <EmptyMessage>Add your first practice session to start logging</EmptyMessage>
          )}
        </Card>

        {/* CARD 4 — GPS Session (skipped entirely when config.training.gps is null) */}
        {t.gps !== null && (
          <Card
            icon={<Satellite size={16} />}
            title="GPS Session"
            subtitle={isDemo ? t.gps.subtitle : 'Not connected'}
            accent="rgb(34, 211, 238)"
            onTap={() => onNavigate('gps')}
          >
            {isDemo ? (
              <Detail rows={t.gps.rows} />
            ) : (
              <EmptyMessage>Not connected — Connect Lumio GPS Tracker</EmptyMessage>
            )}
          </Card>
        )}

        {/* CARD 5 — Video Review */}
        <Card
          icon={<Video size={16} />}
          title="Video Review"
          subtitle={isDemo ? t.video.subtitle : 'Upload your first match footage'}
          accent="rgb(96, 165, 250)"
          onTap={() => onNavigate('video')}
        >
          {isDemo ? (
            <Detail rows={t.video.rows} />
          ) : (
            <EmptyMessage>No video library yet — Upload match footage to unlock this</EmptyMessage>
          )}
        </Card>

        {/* CARD 6 — Nutrition */}
        <Card
          icon={<Utensils size={16} />}
          title="Nutrition"
          subtitle={isDemo ? t.nutrition.subtitle : 'No nutrition plan yet'}
          accent="rgb(245, 158, 11)"
          onTap={() => onNavigate('nutrition')}
        >
          {isDemo ? (
            <Detail rows={t.nutrition.rows} />
          ) : (
            <EmptyMessage>No nutrition data yet — Connect your plan to unlock this</EmptyMessage>
          )}
        </Card>

        {/* CARD 7 — Mental Performance */}
        <Card
          icon={<Brain size={16} />}
          title="Mental Performance"
          subtitle={isDemo ? t.mental.subtitle : 'Add your first session'}
          accent="rgb(196, 181, 253)"
          onTap={() => onNavigate('mental')}
        >
          {isDemo ? (
            <Detail rows={t.mental.rows} />
          ) : (
            <EmptyMessage>No sessions logged — Connect your mental performance coach</EmptyMessage>
          )}
        </Card>

        {/* CARD 8 — Equipment */}
        <Card
          icon={<Zap size={16} />}
          title="Equipment"
          subtitle={isDemo ? t.equipment.subtitle : 'No equipment data logged'}
          accent="rgb(252, 211, 77)"
          onTap={() => onNavigate('racket')}
        >
          {isDemo ? (
            <Detail rows={t.equipment.rows} />
          ) : (
            <EmptyMessage>No equipment data logged — Add your gear to unlock this</EmptyMessage>
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
