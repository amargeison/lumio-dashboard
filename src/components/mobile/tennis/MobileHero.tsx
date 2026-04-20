'use client'
import React from 'react'

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
}

const TINT_MAP: Record<NonNullable<MobileHeroStat['tint']>, string> = {
  violet: 'rgb(196, 181, 253)',
  white: 'rgb(245, 243, 255)',
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
}: MobileHeroProps) {
  return (
    <div className="px-4 mt-2">
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgb(13, 8, 32) 0%, rgb(30, 16, 57) 35%, rgb(76, 29, 149) 70%, rgb(168, 85, 247) 100%)',
          boxShadow: 'rgba(168, 85, 247, 0.44) 0px 12px 40px -8px',
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
            background: 'radial-gradient(circle, rgba(217,70,239,0.53) 0%, rgba(217,70,239,0) 65%)',
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

          {/* Greeting */}
          <h1
            className="mt-3 text-[26px] leading-[1.15] font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {greeting}, {firstName} <span className="inline-block" style={{ animation: 'mobileWave 1.2s ease-in-out 1' }}>👋</span>
          </h1>

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
                color: 'rgba(196, 181, 253, 0.9)',
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
                    color: 'rgba(196, 181, 253, 0.85)',
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
                      color: 'rgba(196, 181, 253, 0.6)',
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
                      color: 'rgba(196, 181, 253, 0.75)',
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
                          color: 'rgba(196, 181, 253, 0.65)',
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
