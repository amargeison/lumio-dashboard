'use client'
import React from 'react'
import { Volume2 } from 'lucide-react'

export type MobileHeroStat = {
  label: string
  value: string
  /** tint key — controls the value colour */
  tint?: 'violet' | 'white' | 'yellow'
  sub?: string
}

export type MobileHeroClock = {
  /** e.g. "LON" */
  city: string
  /** e.g. "12:58" */
  time: string
  /** e.g. "+0" */
  sub?: string
}

export type MobileHeroWeather = {
  icon: string
  temp: string
  city: string
}

export type MobileHeroProps = {
  dateLabel: string
  greeting: string
  firstName: string
  quote: string
  quoteAuthor: string
  stats: MobileHeroStat[]
  weather?: MobileHeroWeather
  clocks?: MobileHeroClock[]
  /**
   * Tap handler for the audio briefing icon next to the greeting. Wired to
   * `useAudioBriefing().toggle` — identical TTS engine as the desktop portal.
   */
  onSpeakerTap?: () => void
  /** When true, the speaker button shows the "playing" visual state. */
  isSpeaking?: boolean
}

const TINT_MAP: Record<NonNullable<MobileHeroStat['tint']>, string> = {
  violet: 'var(--text-accent)',
  white: 'var(--text-primary)',
  yellow: 'var(--yellow)',
}

export function MobileHero({
  dateLabel,
  greeting,
  firstName,
  quote,
  quoteAuthor,
  stats,
  weather,
  clocks,
  onSpeakerTap,
  isSpeaking = false,
}: MobileHeroProps) {
  return (
    <div className="px-4 mt-2">
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'var(--hero-gradient)',
          boxShadow: 'var(--hero-shadow) 0px 12px 40px -8px',
          padding: '20px 18px 18px 18px',
        }}
      >
        {/* Radial blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-70px',
            right: '-60px',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 65%)',
            filter: 'blur(10px)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-60px',
            left: '-50px',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0) 65%)',
            filter: 'blur(8px)',
          }}
        />

        <div className="relative">
          {/* Date pill */}
          <div
            className="text-[11px] font-semibold uppercase"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              color: 'rgba(245, 243, 255, 0.7)',
              letterSpacing: '1.4px',
            }}
          >
            {dateLabel}
          </div>

          {/* Greeting + audio briefing button (mirrors desktop portal's Volume2) */}
          <div className="mt-3 flex items-center gap-2.5">
            <h1
              className="text-[26px] leading-[1.15] font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {greeting}, {firstName}
            </h1>
            <button
              type="button"
              onClick={onSpeakerTap}
              aria-label={isSpeaking ? 'Stop reading' : 'Audio briefing'}
              aria-pressed={isSpeaking}
              className="flex items-center justify-center rounded-lg transition-colors active:scale-[0.92]"
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                background: isSpeaking ? 'rgba(14, 165, 233, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${isSpeaking ? 'rgba(14, 165, 233, 0.55)' : 'rgba(255, 255, 255, 0.12)'}`,
                color: isSpeaking ? 'rgb(56, 189, 248)' : 'rgba(245, 243, 255, 0.85)',
              }}
            >
              <Volume2 size={15} strokeWidth={1.75} />
            </button>
          </div>

          {/* Quote card */}
          <div
            className="mt-3 rounded-xl px-3 py-2.5"
            style={{
              background: 'rgba(0, 0, 0, 0.28)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <p
              className="italic leading-snug"
              style={{ color: 'rgba(245, 243, 255, 0.88)', fontSize: 12.5 }}
            >
              &ldquo;{quote}&rdquo;
            </p>
            <p
              className="mt-1.5 uppercase"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: 10.5,
                letterSpacing: '1.2px',
                color: 'color-mix(in srgb, var(--text-accent) 90%, transparent)',
              }}
            >
              — {quoteAuthor}
            </p>
          </div>

          {/* 4-stat row */}
          <div className="mt-3.5 grid grid-cols-4 gap-2">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-xl px-2 py-2.5"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  animation: `mobileCardIn 450ms ${80 + i * 50}ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
                }}
              >
                <div
                  className="uppercase font-bold"
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                    fontSize: 9,
                    letterSpacing: '0.8px',
                    color: 'color-mix(in srgb, var(--text-accent) 85%, transparent)',
                  }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-1 text-[17px] font-extrabold leading-none"
                  style={{ color: TINT_MAP[s.tint ?? 'white'] }}
                >
                  {s.value}
                </div>
                {s.sub && (
                  <div
                    className="mt-0.5 uppercase"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                      fontSize: 8.5,
                      letterSpacing: '0.6px',
                      color: 'color-mix(in srgb, var(--text-accent) 60%, transparent)',
                    }}
                  >
                    {s.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Weather + world clock */}
          {(weather || clocks) && (
            <div className="mt-3 flex items-center gap-2">
              {weather && (
                <div
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span className="text-sm leading-none">{weather.icon}</span>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {weather.temp}
                  </span>
                  <span
                    className="uppercase"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                      fontSize: 9,
                      letterSpacing: '0.8px',
                      color: 'color-mix(in srgb, var(--text-accent) 75%, transparent)',
                    }}
                  >
                    {weather.city}
                  </span>
                </div>
              )}

              {clocks && clocks.length > 0 && (
                <div
                  className="flex-1 flex items-center rounded-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {clocks.slice(0, 3).map((c, i) => (
                    <div
                      key={c.city}
                      className="flex-1 flex flex-col items-center justify-center py-1"
                      style={{
                        borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      }}
                    >
                      <div
                        className="uppercase"
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                          fontSize: 8.5,
                          letterSpacing: '0.8px',
                          color: 'color-mix(in srgb, var(--text-accent) 65%, transparent)',
                        }}
                      >
                        {c.city}
                      </div>
                      <div
                        className="font-semibold leading-none mt-0.5"
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                          fontSize: 11,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {c.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
