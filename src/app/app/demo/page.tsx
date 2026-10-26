'use client'

import { useEffect } from 'react'
import { saveSession } from '@/components/sports-demo/SportsDemoGate'

// "Explore the demo" in the iPhone app: straight into the coach demo, with
// sample data, without asking for an email first. Everything in the demo lives
// on the phone and nothing in it reaches a real academy, so there is nothing
// to protect behind a code — and Apple asks that an app can be tried without
// handing over personal details.

export default function AppDemo() {
  useEffect(() => {
    try {
      saveSession('coach', {
        email: '', userName: 'Guest', clubName: 'Lumio Tennis Club', role: 'head',
        photoDataUrl: null, logoDataUrl: null, sport: 'coach', verifiedAt: new Date().toISOString(),
      })
      localStorage.setItem('lumio_coach_onboarded', 'true')
      localStorage.setItem('lumio_coach_name', 'Guest')
      localStorage.setItem('lumio_coach_session_ts', String(Date.now()))
      localStorage.setItem('lumio_coach_demo_active', 'true')
    } catch { /* storage blocked: the demo's own sign-in will ask */ }
    window.location.replace('/tennis/coach/demo')
  }, [])
  return <div style={{ minHeight: '100vh', background: '#07080F', color: '#93A1B5', display: 'grid', placeItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: 14 }}>Opening the demo…</div>
}
