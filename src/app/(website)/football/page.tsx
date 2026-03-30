'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const FEATURES = [
  { emoji: '🎙️', title: 'Voice-Powered Briefings', desc: 'Every morning, Lumio reads your squad availability, agent messages, transfer updates and match prep — before you\'ve left your car.' },
  { emoji: '⚽', title: 'Squad & Medical', desc: 'Real-time squad fitness, injury tracking, GPS load monitoring and return-to-play protocols — all in one dashboard.' },
  { emoji: '🔍', title: 'AI Scouting', desc: 'Target identification, scout assignment, video analysis integration and market value tracking. Your entire recruitment pipeline.' },
  { emoji: '📋', title: 'Transfer Room', desc: 'Multi-step transfer workflows from target identification to completion. Budget tracking, agent contacts, board approvals.' },
  { emoji: '🎓', title: 'Academy & EPPP', desc: 'Development pathways, trial management, EPPP compliance and first-team readiness tracking across all age groups.' },
  { emoji: '📊', title: 'Match Analysis', desc: 'Formation builder, opposition analysis, set piece records, xG data and post-match reports — powered by AI.' },
]

export default function FootballLandingPage() {
  return (
    <div style={{ backgroundColor: '#07080F' }}>
      {/* Hero */}
      <section className="py-28 text-center" style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #3d1111 40%, #1a0a0a 100%)' }}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-8" style={{ backgroundColor: 'rgba(192,57,43,0.15)', color: '#E74C3C', border: '1px solid rgba(192,57,43,0.3)' }}>
            ⚽ Lumio Pro Club
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6" style={{ color: '#F9FAFB', lineHeight: 1.1 }}>
            The connected operating system for<br />
            <span style={{ background: 'linear-gradient(135deg, #E74C3C, #F1C40F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>professional football clubs</span>
          </h1>
          <p className="text-lg md:text-xl mx-auto mb-10" style={{ color: '#9CA3AF', maxWidth: 640, lineHeight: 1.7 }}>
            Squad management, scouting, transfers, medical, academy, analysis and operations — unified in one AI-powered platform. Voice-controlled. Board-ready.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demo/football/oakridge-fc" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#C0392B', color: '#F9FAFB' }}>
              Try the demo <ArrowRight size={16} />
            </Link>
            <Link href="https://calendly.com/lumiocms/pro-club" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ color: '#F9FAFB', border: '1px solid #374151' }}>
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Everything your club needs</h2>
          <p className="text-center text-base mb-14 mx-auto" style={{ color: '#9CA3AF', maxWidth: 500 }}>From the training ground to the boardroom. One platform.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <span className="text-3xl block mb-4">{f.emoji}</span>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.title}</h3>
                <p className="text-sm" style={{ color: '#9CA3AF', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center" style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="text-3xl font-black mb-4" style={{ color: '#F9FAFB' }}>Ready to modernise your club?</h2>
          <p className="text-base mb-8" style={{ color: '#9CA3AF' }}>Join the clubs already using Lumio to run smarter operations.</p>
          <Link href="/demo/football/oakridge-fc" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ backgroundColor: '#C0392B', color: '#F9FAFB' }}>
            See the demo <ArrowRight size={18} />
          </Link>
          <p className="text-xs mt-6" style={{ color: '#4B5563' }}>14-day free trial. No commitment. Built in the UK.</p>
        </div>
      </section>
    </div>
  )
}
