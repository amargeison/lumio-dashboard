'use client'

// GPS & Video module wrapped with a photo/video-consent guard: before capturing
// footage, the coach is warned about any players who have NOT given photo/video
// consent (GDPR — children's data).

import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'
import { LiveModule, GPS_CONFIG } from './LiveModules'

export function CoachGpsVideo({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const players = useCoachTable<any>('coach_players')
  const noConsent = players.rows.filter(p => !p.consent_photo)

  return (
    <div>
      {noConsent.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>⚠ Photo / video consent not given</div>
          <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
            Do <b>not</b> capture or upload footage of: {noConsent.map(p => p.name).join(', ')}. Record consent in the Player Roster before filming.
          </div>
        </div>
      )}
      <LiveModule config={GPS_CONFIG} T={T} accent={accent} />
    </div>
  )
}
